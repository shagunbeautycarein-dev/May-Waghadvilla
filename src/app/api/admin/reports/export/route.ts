import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// GET /api/admin/reports/export?type=pdf|excel&report=income|expense|ledger|occupancy&month=&year=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "pdf";
    const report = searchParams.get("report") || "income";
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const guestId = searchParams.get("guestId");

    const now = new Date();
    const month = monthParam ? Number(monthParam) : now.getMonth() + 1;
    const year = yearParam ? Number(yearParam) : now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    let data: any[] = [];
    let title = "";
    let headers: string[] = [];

    if (report === "income") {
      title = `Monthly Income Report — ${month}/${year}`;
      headers = ["Date", "Guest", "Type", "Amount"];
      const payments = await prisma.payment.findMany({
        where: {
          status: "Approved",
          createdAt: { gte: startDate, lte: endDate },
          type: { in: ["Rent", "Deposit"] },
        },
        include: { guest: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      });
      const elec = await prisma.electricitySplit.findMany({
        where: {
          status: "Paid",
          createdAt: { gte: startDate, lte: endDate },
        },
        include: { guest: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      });
      data = [
        ...payments.map((p) => ({
          date: p.createdAt.toISOString().split("T")[0],
          guest: p.guest?.name || "—",
          type: p.type,
          amount: Number(p.amount),
        })),
        ...elec.map((s) => ({
          date: s.createdAt.toISOString().split("T")[0],
          guest: s.guest?.name || "—",
          type: "Electricity",
          amount: Number(s.amount),
        })),
      ];
    } else if (report === "expense") {
      title = `Expense Report — ${month}/${year}`;
      headers = ["Date", "Category", "Amount", "Vendor", "Mode"];
      const expenses = await prisma.expense.findMany({
        where: {
          deletedAt: null,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: "asc" },
      });
      data = expenses.map((e) => ({
        date: e.date.toISOString().split("T")[0],
        category: e.category,
        amount: Number(e.amount),
        vendor: e.vendorName || "—",
        mode: e.paymentMode || "—",
      }));
    } else if (report === "ledger") {
      title = `Guest Ledger Report`;
      headers = ["Date", "Description", "Amount", "Paid", "Due", "Status"];
      const where: any = {};
      if (guestId) where.guestId = guestId;
      const ledger = await prisma.ledger.findMany({
        where,
        include: { guest: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
      data = ledger.map((l) => ({
        date: l.createdAt.toISOString().split("T")[0],
        description: l.description,
        amount: Number(l.amount),
        paid: Number(l.paid),
        due: Number(l.due),
        status: l.status,
      }));
    } else if (report === "occupancy") {
      title = `Occupancy Report — ${month}/${year}`;
      headers = ["Room", "Floor", "Total Beds", "Occupied", "Vacant", "Rate %"];
      const rooms = await prisma.room.findMany({
        where: { deletedAt: null },
        include: { floor: true, beds: { where: { deletedAt: null } } },
      });
      data = rooms.map((r) => {
        const total = r.beds.length;
        const occupied = r.beds.filter((b) =>
          ["Occupied", "Move-In Scheduled"].includes(b.status)
        ).length;
        return {
          room: r.name,
          floor: r.floor.name,
          total,
          occupied,
          vacant: total - occupied,
          rate: total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0,
        };
      });
    }

    if (type === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      autoTable(doc, {
        head: [headers],
        body: data.map((row) =>
          headers.map((h) => {
            const key = h.toLowerCase().replace(/[%\/]/g, "").trim();
            const val = row[key] ?? row[h.toLowerCase()] ?? "—";
            return typeof val === "number" ? `Rs.${val.toLocaleString("en-IN")}` : String(val);
          })
        ),
        startY: 30,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 185, 129] },
      });
      const pdfBytes = doc.output("arraybuffer");
      return new NextResponse(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${report}-report-${month}-${year}.pdf"`,
        },
      });
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, report);
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${report}-report-${month}-${year}.xlsx"`,
        },
      });
    }
  } catch (e: any) {
    console.error("GET /api/admin/reports/export error:", e);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
