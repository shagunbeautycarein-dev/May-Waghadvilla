"use client";

import { useState, useEffect } from "react";
import { X, Phone, Calendar, Sparkles, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";

const STORAGE_KEY = "waghad_popup_dismissed";

export function CTAPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if dismissed permanently
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setShow(true), 12000);
    return () => clearTimeout(timer);
  }, []);

  const close = () => setShow(false);

  const dismissForever = () => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Top gradient banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 pt-6 pb-8 text-white text-center">
          <div className="flex justify-end mb-2">
            <button onClick={close} className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-1">Book Your Stay Today!</h3>
          <p className="text-emerald-100 text-sm">Premium PG in Ambawadi, Ahmedabad</p>
        </div>

        {/* Overlap card */}
        <div className="px-6 pb-6 -mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 mb-4 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
            AC rooms · WiFi · Homely meals · 24/7 Security
          </div>

          <div className="space-y-3">
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="flex items-center justify-center gap-2 w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors text-sm"
            >
              <Phone className="w-4 h-4" /> Call Now — Free Visit
            </a>
            <a
              href="/contact"
              className="flex items-center justify-center gap-2 w-full h-12 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-2xl transition-colors text-sm"
            >
              <Calendar className="w-4 h-4" /> Schedule a Visit
            </a>
          </div>

          <button
            onClick={dismissForever}
            className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );
}
