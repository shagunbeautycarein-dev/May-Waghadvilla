"use client";

import { useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export function GalleryLightbox({ images }: { images: string[] }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  if (!open) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setOpen(true); }}
            className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image
              src={img}
              alt={`Gallery image ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={() => setOpen(false)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div 
        className="relative w-full h-full max-w-4xl max-h-screen p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[current]}
          alt={`Gallery image ${current + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <button
        onClick={() => setOpen(false)}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}
