import { getCmsSettings, getGalleryImages } from "@/lib/cms";
import { generateSEO } from "@/lib/seo";
import { ImageOff } from "lucide-react";

export const metadata = generateSEO({
  title: "Gallery",
  description:
    "View photos of The Waghad Villa â€” rooms, amenities, common areas, and more. Best PG in Ambawadi Ahmedabad.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const cms = await getCmsSettings();
  const images = getGalleryImages(cms);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Gallery â€” The Waghad Villa
        </h1>
        <p className="mt-2 text-slate-600">
          Take a look at our premium PG in Ambawadi Ahmedabad
        </p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((src, i) => (
            <div
              key={i}
              className="bg-slate-100 aspect-square rounded-xl overflow-hidden border border-slate-200 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Gallery image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <ImageOff className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">
            Gallery images coming soon
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Check back later for a look inside The Waghad Villa.
          </p>
        </div>
      )}
    </div>
  );
}
