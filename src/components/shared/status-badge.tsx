"use client";

import { Badge } from "@/components/ui/badge";
import { BED_STATUS_COLORS, INQUIRY_STATUS_COLORS } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusBadgeProps {
  status: string;
  type?: "bed" | "inquiry";
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  Available: "Bed is vacant and ready for booking",
  Reserved: "Bed is reserved for an upcoming guest",
  "Move-In Scheduled": "Guest has confirmed and will move in soon",
  Occupied: "Bed is currently occupied by a guest",
  "Notice Period": "Guest has submitted leaving notice",
  Maintenance: "Bed is under maintenance and unavailable",
  "New Inquiry": "New potential guest inquiry received",
  "Follow Up": "Inquiry requires follow-up action",
  Visited: "Guest has visited the property",
  Confirmed: "Inquiry confirmed and booking finalized",
  Cancelled: "Inquiry has been cancelled",
};

export function StatusBadge({ status, type = "bed" }: StatusBadgeProps) {
  const colors = type === "bed" ? BED_STATUS_COLORS : INQUIRY_STATUS_COLORS;
  const className = colors[status] || "bg-gray-100 text-gray-800";
  const description = STATUS_DESCRIPTIONS[status] || status;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-help ${className}`}>
          {status}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}
