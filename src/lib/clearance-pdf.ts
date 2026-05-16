import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ClearanceData {
  leavingRequest: {
    guest: { name: string; mobile: string; room?: { name: string }; bed?: { name: string } };
    requestDate: string;
    lastDate: string;
    reason: string;
  };
  pendingRent: number;
  pendingElectricity: number;
  depositPaid: number;
  totalDeductions: number;
  refundDue: number;
}

export function generateClearancePDF(data: ClearanceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const TEAL: [number, number, number] = [15, 118, 110];

  doc.setFontSize(18);
  doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
  doc.text("The Waghad Villa", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text("Final Clearance & Settlement", pageWidth / 2, 24, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, 30, { align: "center" });

  let y = 40;

  // Guest Info
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Guest Information", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Field", "Value"]],
    body: [
      ["Name", data.leavingRequest.guest.name],
      ["Mobile", data.leavingRequest.guest.mobile || "-"],
      ["Room", data.leavingRequest.guest.room?.name || "-"],
      ["Bed", data.leavingRequest.guest.bed?.name || "-"],
      ["Last Date", new Date(data.leavingRequest.lastDate).toLocaleDateString("en-IN")],
      ["Reason", data.leavingRequest.reason || "-"],
    ],
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Settlement
  doc.setFontSize(11);
  doc.text("Settlement Summary", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Description", "Amount (₹)"]],
    body: [
      ["Security Deposit Paid", data.depositPaid.toLocaleString("en-IN")],
      ["Less: Pending Rent", `(${data.pendingRent.toLocaleString("en-IN")})`],
      ["Less: Pending Electricity", `(${data.pendingElectricity.toLocaleString("en-IN")})`],
      ["Less: Damage Deductions", `(${data.totalDeductions.toLocaleString("en-IN")})`],
      ["NET REFUND DUE", data.refundDue.toLocaleString("en-IN")],
    ],
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 100 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("This is a computer generated clearance statement.", pageWidth / 2, y + 10, { align: "center" });
  doc.text("The Waghad Villa | Admin Office", pageWidth / 2, y + 16, { align: "center" });

  return doc;
}
