"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RoomImageGalleryProps {
  images: string[];
  roomName: string;
}

export function RoomImageGallery({ images, roomName }: RoomImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel({ loop: true });

  const onSelect = useCallback(() => {
    if (!emblaMainApi) return;
    setSelectedIndex(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on("select", onSelect);
    emblaMainApi.on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaMainApi) emblaMainApi.scrollTo(index);
    },
    [emblaMainApi]
  );

  const scrollPrev = useCallback(() => {
    if (emblaMainApi) emblaMainApi.scrollPrev();
  }, [emblaMainApi]);

  const scrollNext = useCallback(() => {
    if (emblaMainApi) emblaMainApi.scrollNext();
  }, [emblaMainApi]);

  if (!images || images.length === 0) {
    return (
      <div className="bg-slate-100 h-72 sm:h-96 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
        <span className="text-slate-400 text-sm font-medium">No Images Available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Swipeable Area */}
      <div className="relative group">
        <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100 bg-slate-100 h-72 sm:h-96" ref={emblaMainRef}>
          <div className="flex touch-pan-y h-full">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative flex-[0_0_100%] min-w-0 h-full"
              >
                <img
                  src={img}
                  alt={`${roomName} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows for Main Image (visible on hover) */}
        {images.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
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
              onClick={() => scrollTo(index)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                selectedIndex === index
                  ? "border-emerald-500 opacity-100 scale-105 shadow-sm"
                  : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
              )}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Optional overlay for unselected state */}
              {selectedIndex !== index && (
                <div className="absolute inset-0 bg-black/10 transition-opacity hover:bg-transparent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
