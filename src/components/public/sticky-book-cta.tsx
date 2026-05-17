"use client";

import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function StickyBookCTA() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:hidden">
      <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">Book Your Free Visit Now!</p>
          <p className="text-xs opacity-90">Limited beds available</p>
        </div>
        <Button 
          size="sm" 
          variant="secondary" 
          className="shrink-0 h-9 bg-white text-emerald-700 hover:bg-gray-100"
          asChild
        >
          <a href="/contact">
            <Calendar className="w-4 h-4 mr-1" />
            Book
          </a>
        </Button>
        <button 
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 hover:bg-emerald-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
