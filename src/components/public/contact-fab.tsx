"use client";

import { Phone, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export function ContactFAB({
  phone,
  whatsapp,
}: {
  phone?: string;
  whatsapp?: string;
}) {
  const [open, setOpen] = useState(false);

  const cleanPhone = phone?.replace(/\D/g, "") || "";
  const cleanWhatsapp = whatsapp?.replace(/\D/g, "") || cleanPhone;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <>
          <a
            href={`https://wa.me/${cleanWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
            title="WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          <a
            href={`tel:${phone || ""}`}
            className="w-12 h-12 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
            title="Call"
          >
            <Phone className="w-5 h-5" />
          </a>
        </>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
      </button>
    </div>
  );
}
