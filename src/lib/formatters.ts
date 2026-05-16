import { format } from "date-fns";

/**
 * Format a date string or Date object to a readable date.
 * @example formatDate("2024-01-15") → "Jan 15, 2024"
 */
export function formatDate(
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  try {
    const date = typeof value === "string" ? new Date(value) : value;
    return format(date, "MMM dd, yyyy");
  } catch {
    return String(value);
  }
}

/**
 * Format a date string or Date object to a readable date + time.
 * @example formatDateTime("2024-01-15T14:30:00Z") → "Jan 15, 2024 at 2:30 PM"
 */
export function formatDateTime(
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  try {
    const date = typeof value === "string" ? new Date(value) : value;
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  } catch {
    return String(value);
  }
}

/**
 * Format a number as Indian Rupees currency.
 * @example formatCurrency(12500) → "₹12,500"
 */
export function formatCurrency(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
}

/**
 * Format a number as Indian Rupees with decimal places.
 * @example formatCurrencyPrecise(12500.5) → "₹12,500.50"
 */
export function formatCurrencyPrecise(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a number with Indian locale.
 * @example formatNumber(12500) → "12,500"
 */
export function formatNumber(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-IN");
}

/**
 * Format a relative time from a date (e.g., "2 days ago").
 * Falls back to date-only if date-fns distance is not available.
 */
export function formatRelativeDate(
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  try {
    const date = typeof value === "string" ? new Date(value) : value;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 30) return formatDate(date);
    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHr > 0) return `${diffHr}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "Just now";
  } catch {
    return String(value);
  }
}
