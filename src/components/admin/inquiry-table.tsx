"use client";

import { Inquiry } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";

interface InquiryTableProps {
  inquiries: Inquiry[];
  compact?: boolean;
}

export function InquiryTable({ inquiries, compact }: InquiryTableProps) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead className="text-slate-500 font-medium">Name</TableHead>
            <TableHead className="text-slate-500 font-medium">Mobile</TableHead>
            <TableHead className="text-slate-500 font-medium">Visit Date</TableHead>
            <TableHead className="text-slate-500 font-medium">Status</TableHead>
            {!compact && <TableHead className="text-slate-500 font-medium">Time Slot</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 4 : 5} className="text-center text-slate-500 py-8">
                No inquiries found
              </TableCell>
            </TableRow>
          ) : (
            inquiries.map((inquiry) => (
              <TableRow key={inquiry.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-900">{inquiry.name}</TableCell>
                <TableCell className="text-slate-600">{inquiry.mobile}</TableCell>
                <TableCell className="text-slate-600">
                  {format(new Date(inquiry.visitDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={inquiry.status} type="inquiry" />
                </TableCell>
                {!compact && <TableCell className="text-slate-600">{inquiry.timeSlot}</TableCell>}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
