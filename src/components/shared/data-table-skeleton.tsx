"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface DataTableSkeletonProps {
  columns: number;
  rows?: number;
  showHeader?: boolean;
}

export function DataTableSkeleton({
  columns,
  rows = 5,
  showHeader = true,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full space-y-3">
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg ml-auto" />
        </div>
      )}
      <div className="border rounded-xl overflow-hidden">
        {showHeader && (
          <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={`header-${i}`}
                className="h-4 rounded"
                style={{ width: `${Math.max(60, 100 / columns - 4)}%` }}
              />
            ))}
          </div>
        )}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="flex items-center gap-4 px-4 py-4">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Skeleton
                  key={`cell-${rowIdx}-${colIdx}`}
                  className="h-4 rounded"
                  style={{ width: `${Math.max(60, 100 / columns - 4)}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
