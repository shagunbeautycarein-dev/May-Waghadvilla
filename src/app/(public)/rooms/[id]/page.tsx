import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-safe";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoomImageGallery } from "@/components/public/room-image-gallery";
import { BedDouble, Wifi, Utensils, Zap, MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import { productSchema, breadcrumbSchema } from "@/lib/schema";
import { siteConfig } from "@/config/site";

interface RoomDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id } = await params;
  
  const room = await safeQuery(
    async () =>
      prisma.room.findUnique({
        where: { id, status: "Active", deletedAt: null },
        include: {
          floor: true,
          beds: { where: { deletedAt: null } },
        },
      }),
    null
  );

  if (!room) {
    notFound();
  }

  const images = room.images?.length > 0 ? room.images : room.coverImage ? [room.coverImage] : [];
  const availableBeds = room.beds.filter((b) => b.status === "Available").length;
  const minRent = room.beds.length > 0 ? Math.min(...room.beds.map((b) => Number(b.rent))) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema({ ...room, minRent })) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: siteConfig.url },
              { name: 'Rooms', url: `${siteConfig.url}/rooms` },
              { name: room.name, url: `${siteConfig.url}/rooms/${room.id}` },
            ])
          ),
        }}
      />
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-brand-600">
            <Link href="/rooms">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Rooms
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image Gallery */}
          <div>
            <RoomImageGallery images={images} roomName={room.name} />
          </div>

          {/* Right: Room Details */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-brand-500 text-white border-none px-3 py-1 rounded-full">
                  {room.sharingType}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 px-3 py-1 rounded-full">
                  {room.acType}
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {room.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-2 text-slate-500">
                <MapPin className="w-4 h-4 text-brand-500" />
                {room.floor.name}
              </div>
            </div>

            {room.description && (
              <p className="text-slate-600 leading-relaxed">{room.description}</p>
            )}

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Wifi className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">WiFi</p>
                  <p className="text-xs text-slate-500">{room.wifiName || "Available"}</p>
                </div>
              </div>
              {room.mealsIncluded && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <Utensils className="w-5 h-5 text-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Meals</p>
                    <p className="text-xs text-slate-500">Included</p>
                  </div>
                </div>
              )}
              {room.electricityIncluded && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <Zap className="w-5 h-5 text-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Electricity</p>
                    <p className="text-xs text-slate-500">Included</p>
                  </div>
                </div>
              )}
            </div>

            {/* Beds */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Beds <span className="text-slate-400 font-normal text-sm">({room.beds.length} total)</span>
              </h3>
              <div className="space-y-3">
                {room.beds.map((bed) => (
                  <div
                    key={bed.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <BedDouble className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Bed {bed.name}</p>
                        <p className="text-xs text-slate-500">Deposit: ₹{Number(bed.deposit).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-600">₹{Number(bed.rent).toLocaleString("en-IN")}/mo</p>
                      <Badge
                        className={`text-xs rounded-full px-2 py-0.5 ${
                          bed.status === "Available"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {bed.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Starting from</p>
                  <p className="text-3xl font-bold text-brand-600">
                    {minRent !== null ? `₹${minRent.toLocaleString("en-IN")}` : "N/A"}
                    <span className="text-sm font-normal text-slate-500">/mo</span>
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-brand-600 hover:bg-brand-700 text-white rounded-2xl h-12 px-8"
                >
                  <Link href="/contact">Book a Visit</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
