"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  { name: "Rahul S.", role: "Software Developer", text: "Best PG in Ambawadi for working professionals. Clean rooms, amazing food, unbeatable location near Vijay Cross Road.", rating: 5 },
  { name: "Priya M.", role: "CA Student", text: "I searched many girls PGs in Ahmedabad before finding Waghad Villa. Safety, cleanliness, friendly management — highly recommended!", rating: 5 },
  { name: "Amit K.", role: "MBA Student", text: "Affordable PG with AC and WiFi near Law Garden. Fair rent calculation, great value for money.", rating: 4 },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">What Our Residents Say</h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {testimonials.map((t, i) => (
                <div key={i} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star 
                          key={si} 
                          className={cn("w-4 h-4", si < t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === current ? "bg-emerald-600" : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
