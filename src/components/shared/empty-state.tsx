"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  action?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {subtitle && (
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{subtitle}</p>
      )}
      {actionLabel && action && (
        <Button
          onClick={action}
          variant="outline"
          className="mt-4 rounded-lg"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
