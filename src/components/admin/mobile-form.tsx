import { cn } from "@/lib/utils";

export function MobileFormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col md:flex-row md:items-center gap-2 md:gap-4", className)}>{children}</div>;
}

export function MobileFormLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("text-sm font-medium md:w-32 md:text-right shrink-0 text-slate-700", className)}>{children}</label>;
}

export function MobileFormInput({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex-1", className)}>{children}</div>;
}
