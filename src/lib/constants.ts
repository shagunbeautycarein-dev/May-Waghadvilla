export const BED_STATUSES = [
  "Available",
  "Reserved",
  "Move-In Scheduled",
  "Occupied",
  "Notice Period",
  "Maintenance",
] as const;

export const INQUIRY_STATUSES = [
  "New Inquiry",
  "Follow Up",
  "Visited",
  "Confirmed",
  "Cancelled",
] as const;

export const TIME_SLOTS = ["Morning", "Afternoon", "Evening"] as const;

export const SHARING_TYPES = ["1-sharing", "2-sharing", "3-sharing", "4-sharing", "5-sharing", "6-sharing", "7-sharing", "8-sharing", "9-sharing", "10-sharing"] as const;
export const AC_TYPES = ["AC", "Non-AC"] as const;
export const ROOM_STATUSES = ["Active", "Inactive", "Maintenance"] as const;

export const BED_STATUS_COLORS: Record<string, string> = {
  Available: "bg-green-100 text-green-800 border-green-200",
  Reserved: "bg-blue-100 text-blue-800 border-blue-200",
  "Move-In Scheduled": "bg-purple-100 text-purple-800 border-purple-200",
  Occupied: "bg-gray-100 text-gray-800 border-gray-200",
  "Notice Period": "bg-orange-100 text-orange-800 border-orange-200",
  Maintenance: "bg-red-100 text-red-800 border-red-200",
};

export const INQUIRY_STATUS_COLORS: Record<string, string> = {
  "New Inquiry": "bg-blue-100 text-blue-800",
  "Follow Up": "bg-yellow-100 text-yellow-800",
  Visited: "bg-purple-100 text-purple-800",
  Confirmed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

export const ONBOARDING_STATUSES = [
  "Draft",
  "Submitted",
  "Pending Approval",
  "Approved",
  "Rejected",
  "On Hold",
] as const;

export const PAYMENT_STATUSES = [
  "Uploaded",
  "Under Review",
  "Approved",
  "Rejected",
] as const;

export const PAYMENT_TYPES = ["Rent", "Deposit", "Electricity", "Other"] as const;

export const GUEST_STATUSES = [
  "Onboarding Started",
  "Active (Pending Move-In)",
  "Active",
  "Notice Period",
  "Left",
] as const;

export const LEDGER_STATUSES = ["Pending", "Partial", "Paid"] as const;

export const ONBOARDING_STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-800",
  Submitted: "bg-blue-100 text-blue-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  "On Hold": "bg-orange-100 text-orange-800",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  Uploaded: "bg-blue-100 text-blue-800",
  "Under Review": "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

export const GUEST_STATUS_COLORS: Record<string, string> = {
  "Onboarding Started": "bg-blue-100 text-blue-800",
  "Active (Pending Move-In)": "bg-purple-100 text-purple-800",
  Active: "bg-green-100 text-green-800",
  "Notice Period": "bg-orange-100 text-orange-800",
  Left: "bg-gray-100 text-gray-800",
};

export const LEDGER_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-red-100 text-red-800",
  Partial: "bg-yellow-100 text-yellow-800",
  Paid: "bg-green-100 text-green-800",
};
