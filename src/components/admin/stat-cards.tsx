import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardsProps {
  title: string;
  value: number;
  total?: number;
  icon: LucideIcon;
}

export function StatCards({ title, value, total, icon: Icon }: StatCardsProps) {
  return (
    <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {value}
              {total !== undefined && (
                <span className="text-sm font-normal text-slate-400 ml-1">/ {total}</span>
              )}
            </p>
          </div>
          <div className="bg-teal-50 p-3 rounded-xl">
            <Icon className="w-5 h-5 text-teal-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
