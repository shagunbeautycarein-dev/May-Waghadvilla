"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";

interface RoomImageGalleryProps {
  images: string[];
  roomName: string;
}

export function RoomImageGallery({ images, roomName }: RoomImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel({ loop: true });

  const onSelect = useCallback(() => {
    if (!emblaMainApi) return;
    setSelectedIndex(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on("select", onSelect);
    emblaMainApi.on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  // Close lightbox on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length]);

  const scrollTo = useCallback((index: number) => {
    if (emblaMainApi) emblaMainApi.scrollTo(index);
  }, [emblaMainApi]);

  const scrollPrev = useCallback(() => { if (emblaMainApi) emblaMainApi.scrollPrev(); }, [emblaMainApi]);
  const scrollNext = useCallback(() => { if (emblaMainApi) emblaMainApi.scrollNext(); }, [emblaMainApi]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-slate-100 h-72 sm:h-96 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
        <span className="text-slate-400 text-sm font-medium">No Images Available</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Swipeable Area */}
        <div className="relative group cursor-zoom-in" onClick={() => openLightbox(selectedIndex)}>
          <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100 bg-slate-100 h-72 sm:h-96" ref={emblaMainRef}>
            <div className="flex touch-pan-y h-full">
              {images.map((img, index) => (
                <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full">
                  <Image fill src={img} alt={`${roomName} ${index + 1}`} className="object-cover" />
                </div>
              ))}
            </div>
          </div>
          {/* Zoom hint */}
          <div className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="w-4 h-4" />
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); scrollNext(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => { scrollTo(index); openLightbox(index); }}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                  selectedIndex === index
                    ? "border-emerald-500 opacity-100 scale-105 shadow-sm"
                    : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                )}
              >
                <Image fill src={img} alt={`Thumbnail ${index + 1}`} className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Image */}
          <div
            className="relative w-full max-w-4xl max-h-[85vh] mx-4 aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              fill
              src={images[lightboxIndex]}
              alt={`${roomName} ${lightboxIndex + 1}`}
              className="object-contain"
            />
          </div>

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + images.length) % images.length); }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % images.length); }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
