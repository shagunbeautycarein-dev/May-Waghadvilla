"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SHARING_TYPES } from "@/lib/constants";
import { Filter, X, BedDouble } from "lucide-react";
import { breadcrumbSchema } from "@/lib/schema";
import { siteConfig } from "@/config/site";
import Image from "next/image";

interface Room {
  id: string;
  name: string;
  sharingType: string;
  acType: string;
  mealsIncluded: boolean;
  floor: { name: string };
  images: string[];
  coverImage: string | null;
  beds: { id: string; rent: number; deposit: number; status: string }[];
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [sharingTypes, setSharingTypes] = useState<string[]>([]);
  const [acType, setAcType] = useState<string>("");
  const [mealsIncluded, setMealsIncluded] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    sharingTypes.forEach((t) => params.append("sharingType", t));
    if (acType) params.set("acType", acType);
    if (mealsIncluded) params.set("mealsIncluded", "true");
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (availableOnly) params.set("availableOnly", "true");

    setLoading(true);
    fetch(`/api/public/rooms?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sharingTypes, acType, mealsIncluded, minPrice, maxPrice, availableOnly]);

  const toggleSharingType = (type: string) => {
    setSharingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSharingTypes([]);
    setAcType("");
    setMealsIncluded(false);
    setMinPrice("");
    setMaxPrice("");
    setAvailableOnly(false);
  };

  const hasActiveFilters =
    sharingTypes.length > 0 ||
    acType ||
    mealsIncluded ||
    minPrice ||
    maxPrice ||
    availableOnly;

  const Filters = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-teal-700 hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Sharing Type</h4>
        <div className="space-y-2">
          {SHARING_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`sharing-${type}`}
                checked={sharingTypes.includes(type)}
                onCheckedChange={() => toggleSharingType(type)}
              />
              <Label htmlFor={`sharing-${type}`} className="text-sm text-slate-600">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">AC Type</h4>
        <div className="space-y-2">
          {["AC", "Non-AC"].map((type) => (
            <div key={type} className="flex items-center gap-2">
              <input
                type="radio"
                name="acType"
                id={`ac-${type}`}
                checked={acType === type}
                onChange={() => setAcType(type)}
                className="h-4 w-4 text-teal-700 border-slate-300 focus:ring-teal-700"
              />
              <Label htmlFor={`ac-${type}`} className="text-sm text-slate-600">
                {type}
              </Label>
            </div>
          ))}
          {acType && (
            <button
              onClick={() => setAcType("")}
              className="text-xs text-teal-700 hover:underline mt-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Meals Included</h4>
        <div className="flex items-center gap-2">
          <Checkbox
            id="meals"
            checked={mealsIncluded}
            onCheckedChange={(checked) => setMealsIncluded(checked === true)}
          />
          <Label htmlFor="meals" className="text-sm text-slate-600">
            Yes
          </Label>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Price Range (â‚¹)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="minPrice" className="text-xs text-slate-500 mb-1 block">
              Min
            </Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maxPrice" className="text-xs text-slate-500 mb-1 block">
              Max
            </Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="20000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Availability</h4>
        <div className="flex items-center gap-2">
          <Checkbox
            id="available"
            checked={availableOnly}
            onCheckedChange={(checked) => setAvailableOnly(checked === true)}
          />
          <Label htmlFor="available" className="text-sm text-slate-600">
            Available beds only
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: siteConfig.url },
              { name: 'Rooms', url: `${siteConfig.url}/rooms` },
            ])
          ),
        }}
      />
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Our Rooms
        </h1>
        <p className="mt-3 text-slate-600 max-w-xl mx-auto">
          Find the perfect room at The Waghad Villa. Filter by sharing type, AC, and budget.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Mobile filter toggle */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full rounded-full border-slate-200"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 h-2 w-2 rounded-full bg-teal-700" />
            )}
          </Button>
          {mobileFiltersOpen && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <Filters />
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="rounded-xl border border-slate-100 bg-white p-5 sticky top-24 shadow-sm">
            <Filters />
          </div>
        </aside>

        {/* Room grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4 space-y-4 bg-white shadow-sm">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-slate-100 bg-slate-50">
              <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                No rooms available
              </h3>
              <p className="mt-1 text-slate-500">
                Try adjusting your filters to see more results.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  onClick={clearFilters}
                  className="mt-4 text-teal-700"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {rooms.map((room) => {
                const availableBeds = room.beds.filter(
                  (b) => b.status === "Available"
                ).length;
                const minRent =
                  room.beds.length > 0
                    ? Math.min(...room.beds.map((b) => b.rent))
                    : null;
                const isOccupied = availableBeds === 0;
                const imageSrc = room.coverImage || (room.images && room.images.length > 0 ? room.images[0] : null);

                return (
                  <div
                    key={room.id}
                    className="flex flex-col gap-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="bg-slate-100 h-48 rounded-xl overflow-hidden relative">
                      {imageSrc ? (
                        <Image
                          fill
                          src={imageSrc}
                          alt={room.name}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-slate-400 text-sm font-medium">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="px-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {room.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">{room.floor.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 px-1">
                      <Badge variant="secondary" className="rounded-full px-3">
                        {room.sharingType}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3">
                        {room.acType}
                      </Badge>
                      {isOccupied && (
                        <Badge variant="destructive" className="rounded-full px-3">
                          Occupied
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm px-1">
                      {minRent !== null ? (
                        <span className="font-semibold text-teal-700">
                          Starting â‚¹{minRent.toLocaleString("en-IN")}/mo
                        </span>
                      ) : (
                        <span className="text-slate-400">Rent on request</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 px-1">
                      {availableBeds} bed{availableBeds !== 1 ? "s" : ""} available
                    </p>
                    {isOccupied ? (
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-slate-200"
                        disabled
                      >
                        Fully Occupied
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-full border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                      >
                        <Link href={`/rooms/${room.id}`}>View Details</Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
