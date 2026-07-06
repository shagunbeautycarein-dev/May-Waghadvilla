import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OnboardingData {
  step1Personal?: {
    fullName?: string;
    dob?: string;
    bloodGroup?: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  } | null;
  step2Emergency?: Array<{
    name: string;
    relation: string;
    mobile: string;
    city?: string;
  }> | null;
  step3Job?: {
    companyName?: string;
    occupation?: string;
    officeAddress?: string;
    officeContact?: string;
  } | null;
  step4Documents?: {
    aadhar?: string;
    pan?: string;
    photo?: string;
    idType?: string;
    idFrontUrl?: string;
    idBackUrl?: string;
  } | null;
}

interface LedgerEntry {
  id: string;
  description: string;
  amount: number;
  paid: number;
  due: number;
  status: string;
  createdAt: string;
}

interface PaymentEntry {
  id: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
}

interface RoomData {
  name: string;
  floor?: { name: string };
  sharingType?: string;
  acType?: string;
  wifiName?: string | null;
  wifiPassword?: string | null;
  amenities?: string[];
}

interface BedData {
  name: string;
}

interface GuestPDFData {
  id: string;
  name: string;
  mobile: string;
  email: string;
  status: string;
  joiningDate: string | null;
  leavingDate: string | null;
  monthlyRent: number | null;
  deposit: number | null;
  rentCycleDate: number | null;
  room: RoomData | null;
  bed: BedData | null;
  onboardingData: OnboardingData | null;
  ledger: LedgerEntry[];
  payments: PaymentEntry[];
}

const TEAL: [number, number, number] = [15, 118, 110];

export function generateGuestPDF(guest: GuestPDFData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  doc.setFontSize(20);
  doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
  doc.text("The Waghad Villa", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text("Guest Profile & KYC Report", pageWidth / 2, 26, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, 32, { align: "center" });

  let y = 40;

  // â”€â”€ Section 1: Personal Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("1. Personal Details", 14, y);
  y += 7;

  const personal = guest.onboardingData?.step1Personal || {};
  autoTable(doc, {
    startY: y,
    head: [["Field", "Value"]],
    body: [
      ["Full Name", personal.fullName || guest.name || "-"],
      ["Mobile", guest.mobile || "-"],
      ["Email", guest.email || "-"],
      ["Date of Birth", personal.dob ? new Date(personal.dob).toLocaleDateString("en-IN") : "-"],
      ["Blood Group", personal.bloodGroup || "-"],
      ["Address", personal.address || "-"],
      ["City / State / PIN", `${personal.city || ""}, ${personal.state || ""} ${personal.pinCode || ""}`],
    ],
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // â”€â”€ Section 2: Room & Rent Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  doc.setFontSize(13);
  doc.text("2. Room & Rent Details", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Field", "Value"]],
    body: [
      ["Room Number", guest.room?.name || "-"],
      ["Floor", guest.room?.floor?.name || "-"],
      ["Bed", guest.bed?.name || "-"],
      ["Sharing Type", guest.room?.sharingType || "-"],
      ["AC Type", guest.room?.acType || "-"],
      ["Monthly Rent", guest.monthlyRent ? `Rs.${guest.monthlyRent.toLocaleString()}` : "-"],
      ["Deposit", guest.deposit ? `Rs.${guest.deposit.toLocaleString()}` : "-"],
      ["Joining Date", guest.joiningDate ? new Date(guest.joiningDate).toLocaleDateString("en-IN") : "-"],
      ["Rent Cycle Date", `${guest.rentCycleDate || 5}th of month`],
      ["WiFi", guest.room?.wifiName ? `${guest.room.wifiName} / ${guest.room.wifiPassword || ""}` : "-"],
      ["Amenities", (guest.room?.amenities || []).join(", ") || "-"],
    ],
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // â”€â”€ Section 3: Emergency Contacts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const emergency = guest.onboardingData?.step2Emergency || [];
  if (emergency.length > 0) {
    doc.setFontSize(13);
    doc.text("3. Emergency Contacts", 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [["Name", "Relation", "Mobile"]],
      body: emergency.map((c) => [
        c.name || "-",
        c.relation || "-",
        c.mobile || "-",
      ]),
      theme: "grid",
      headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // â”€â”€ Section 4: Job Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const job = guest.onboardingData?.step3Job || {};
  if (job.companyName || job.occupation) {
    doc.setFontSize(13);
    doc.text("4. Job Details", 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [["Field", "Value"]],
      body: [
        ["Company", job.companyName || "-"],
        ["Occupation", job.occupation || "-"],
        ["Office Address", job.officeAddress || "-"],
        ["Office Contact", job.officeContact || "-"],
      ],
      theme: "grid",
      headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // â”€â”€ Section 5: KYC Documents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const documents = guest.onboardingData?.step4Documents || {};
  doc.setFontSize(13);
  doc.text("5. KYC Documents", 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Document Type", "Status"]],
    body: [
      ["Aadhar (Front)", documents.aadhar ? "Uploaded" : "Not Uploaded"],
      ["Aadhar (Back)", documents.aadharBack ? "Uploaded" : "Not Uploaded"],
      ["PAN Card", documents.pan ? "Uploaded" : "Not Uploaded"],
      ["Passport Photo", documents.photo ? "Uploaded" : "Not Uploaded"],
    ],
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // â”€â”€ Section 6: Payment History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (guest.payments.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.text("6. Payment History", 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Type", "Method", "Amount", "Status"]],
      body: guest.payments.map((p) => [
        new Date(p.createdAt).toLocaleDateString("en-IN"),
        p.type,
        p.method,
        `Rs.${Number(p.amount).toLocaleString()}`,
        p.status,
      ]),
      theme: "grid",
      headStyles: { fillColor: TEAL, textColor: 255, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // â”€â”€ Section 7: Ledger Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (guest.ledger.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.text("7. Payment Ledger", 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Description", "Amount", "Paid", "Due", "Status"]],
      body: guest.ledger.map((l) => [
        new Date(l.createdAt).toLocaleDateString("en-IN"),
        l.description,
        `Rs.${l.amount.toLocaleString()}`,
        `Rs.${l.paid.toLocaleString()}`,
        `Rs.${l.due.toLocaleString()}`,
        l.status,
      ]),
      theme: "grid",
      headStyles: { fillColor: TEAL, textColor: 255, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Total Due
    const totalDue = guest.ledger.reduce((sum, l) => sum + Number(l.due), 0);
    doc.setFontSize(11);
    doc.setTextColor(200, 0, 0);
    doc.text(`Total Outstanding Due: Rs.${totalDue.toLocaleString()}`, 14, y);
    doc.setTextColor(0);
  }

  // â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `The Waghad Villa | Guest Profile | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return doc;
}
