import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      newInquiries,
      pendingPayments,
      pendingComplaints,
      pendingTransfers,
      pendingLeaving,
    ] = await Promise.all([
      prisma.inquiry.count({
        where: { status: "New Inquiry" },
      }),
      prisma.payment.count({
        where: { status: { in: ["Uploaded", "Under Review"] } },
      }),
      prisma.complaint.count({
        where: { status: "Pending" },
      }),
      prisma.bedTransfer.count({
        where: { status: "requested" },
      }),
      prisma.leavingRequest.count({
        where: { status: "submitted" },
      }),
    ]);

    const items = [
      {
        id: "inquiries",
        type: "inquiry",
        label: "New Inquiries",
        count: newInquiries,
        href: "/admin/inquiries",
      },
      {
        id: "payments",
        type: "payment",
        label: "Pending Payments",
        count: pendingPayments,
        href: "/admin/payments",
      },
      {
        id: "complaints",
        type: "complaint",
        label: "Pending Complaints",
        count: pendingComplaints,
        href: "/admin/complaints",
      },
      {
        id: "transfers",
        type: "transfer",
        label: "Bed Transfer Requests",
        count: pendingTransfers,
        href: "/admin/bed-transfers",
      },
      {
        id: "leaving",
        type: "leaving",
        label: "Leaving Requests",
        count: pendingLeaving,
        href: "/admin/leaving",
      },
    ];

    const total = items.reduce((sum, i) => sum + i.count, 0);

    return NextResponse.json({ total, items });
  } catch (e) {
    console.error("GET /api/admin/notifications error:", e);
    return NextResponse.json(
      { error: "Failed to fetch notifications", total: 0, items: [] },
      { status: 500 }
    );
  }
}
