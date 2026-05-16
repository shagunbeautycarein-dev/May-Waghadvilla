import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, AlertTriangle } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-slate-300" />
        </div>
        <h1 className="text-4xl font-bold text-slate-200">404</h1>
        <p className="text-slate-500 mt-2">Admin page not found.</p>
        <Button
          asChild
          variant="outline"
          className="mt-4 rounded-full"
        >
          <Link href="/admin" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
