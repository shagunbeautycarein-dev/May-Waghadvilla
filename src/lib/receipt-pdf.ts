import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TEAL: [number, number, number] = [15, 118, 110];

export function generateReceiptPDF(payment: any, guest?: any): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const g = guest || payment.guest || {};

  // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  doc.setFontSize(20);
  doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
  doc.text("The Waghad Villa", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text("Payment Receipt", pageWidth / 2, 26, { align: "center" });

  // â”€â”€ Receipt No & Date â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(
    `Receipt No: ${payment.id?.slice(0, 8).toUpperCase() || "N/A"}`,
    14,
    38
  );
  doc.text(
    `Date: ${new Date(payment.createdAt || payment.updatedAt || Date.now()).toLocaleDateString("en-IN")}`,
    pageWidth - 14,
    38,
    { align: "right" }
  );

  // â”€â”€ Guest Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  autoTable(doc, {
    startY: 44,
    head: [["Guest Details", ""]],
    body: [
      ["Name", g.name || "-"],
      ["Mobile", g.mobile || "-"],
      ["Email", g.email || "-"],
      ["Room", g.room?.name || "-"],
      ["Bed", g.bed?.name || "-"],
    ],
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  // â”€â”€ Payment Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: y,
    head: [["Payment Details", ""]],
    body: [
      ["Amount", `Rs.${Number(payment.amount).toLocaleString("en-IN")}`],
      ["Type", payment.type || "-"],
      ["Method", payment.method || "-"],
      ["Transaction ID", payment.transactionId || "-"],
      ["Status", payment.status || "-"],
      [
        "Approved Date",
        new Date(payment.updatedAt || payment.createdAt || Date.now()).toLocaleDateString("en-IN"),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  // â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "This is a computer-generated receipt and does not require a signature.",
    pageWidth / 2,
    finalY,
    { align: "center" }
  );

  return doc;
}
