"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileTableWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("hidden md:block overflow-x-auto w-full", className)}>
      {children}
    </div>
  );
}

export function MobileCards<T>({
  data,
  renderCard,
  className
}: {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("md:hidden space-y-3", className)}>
      {data.map((item, index) => (
        <div key={index}>{renderCard(item, index)}</div>
      ))}
    </div>
  );
}

export function MobileCard({
  title,
  children,
  actions,
  className
}: {
  title: string | React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
      <div
        className="p-4 flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="font-semibold text-sm text-slate-800">{title}</div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />}
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2 text-sm text-slate-600 bg-white">
          {children}
        </div>
      )}
      {actions && <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
