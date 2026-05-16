import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-3xl bg-teal-50 flex items-center justify-center mx-auto mb-6">
          <MapPin className="h-10 w-10 text-teal-500" />
        </div>
        <h1 className="text-6xl font-bold text-slate-200">404</h1>
        <h2 className="text-xl font-semibold text-slate-900 mt-3">Page Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button
          asChild
          className="mt-6 rounded-full bg-teal-600 hover:bg-teal-700 text-white px-8"
        >
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
