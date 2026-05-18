"use client";

import { useEffect, useState, Fragment, useCallback } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  BedDouble,
  Wifi,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Home,
  Sofa,
  Camera,
  Tv,
  Refrigerator,
  Shirt,
  Bath,
  Trees,
  Flame,
  Droplets,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Floor = { id: string; name: string };

type Bed = {
  id: string;
  name: string;
  rent: number;
  deposit: number;
  status: string;
};

type Room = {
  id: string;
  floorId: string;
  name: string;
  sharingType: string;
  acType: string;
  mealsIncluded: boolean;
  electricityIncluded: boolean;
  wifiName: string | null;
  wifiPassword: string | null;
  amenities: string[];
  images: string[];
  coverImage: string | null;
  description: string | null;
  status: string;
  showOnHomePage: boolean;
  floor: Floor;
  beds: Bed[];
  _count: { beds: number };
};

const bedSchema = z.object({
  name: z.string().min(1, "Bed name is required").max(10),
  rent: z.number().positive("Rent must be positive"),
  deposit: z.number().positive("Deposit must be positive"),
});

const roomFormSchema = z.object({
  floorId: z.string().optional(),
  floorName: z.string().optional(),
  name: z.string().min(1, "Name is required").max(50),
  sharingType: z.enum(["1-sharing", "2-sharing", "3-sharing", "4-sharing", "5-sharing", "6-sharing", "7-sharing", "8-sharing", "9-sharing", "10-sharing"]),
  acType: z.enum(["AC", "Non-AC"]),
  mealsIncluded: z.boolean(),
  electricityIncluded: z.boolean(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  amenities: z.array(z.string()),
  images: z.array(z.string()).optional(),
  imagesText: z.string().optional(),
  coverImage: z.string().optional(),
  description: z.string().optional(),
  showOnHomePage: z.boolean(),
  beds: z.array(bedSchema).min(1, "At least one bed is required"),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

const AMENITIES = [
  { label: "WiFi", value: "WiFi", icon: Wifi },
  { label: "TV", value: "TV", icon: Tv },
  { label: "Fridge", value: "Fridge", icon: Refrigerator },
  { label: "Wardrobe", value: "Wardrobe", icon: Shirt },
  { label: "Attached Bath", value: "Attached Bath", icon: Bath },
  { label: "Balcony", value: "Balcony", icon: Trees },
  { label: "Geyser", value: "Geyser", icon: Flame },
  { label: "RO Water", value: "RO Water", icon: Droplets },
];

const SHARING_BED_COUNTS: Record<string, number> = {
  "1-sharing": 1,
  "2-sharing": 2,
  "3-sharing": 3,
  "4-sharing": 4,
  "5-sharing": 5,
  "6-sharing": 6,
  "7-sharing": 7,
  "8-sharing": 8,
  "9-sharing": 9,
  "10-sharing": 10,
};

const BED_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const STEPS = [
  { id: 1, label: "Room Info", icon: Home },
  { id: 2, label: "Beds", icon: BedDouble },
  { id: 3, label: "Amenities", icon: Sofa },
  { id: 4, label: "Photos", icon: Camera },
  { id: 5, label: "WiFi", icon: Wifi },
];

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md"
                    : isCompleted
                    ? "bg-teal-50 text-teal-600 border-2 border-teal-200"
                    : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  isActive
                    ? "text-teal-700"
                    : isCompleted
                    ? "text-teal-600"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-all ${
                  isCompleted ? "bg-teal-300" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ImageUploadField() {
  const { control, watch, setValue } = useFormContext<RoomFormValues>();
  const images = watch("images") || [];
  const coverImage = watch("coverImage");

  const handleCloudinaryUpload = useCallback(
    (newImages: string[]) => {
      setValue("images", newImages, { shouldValidate: true });
      if (!coverImage && newImages.length > 0) {
        setValue("coverImage", newImages[0], { shouldValidate: true });
      }
      toast.success("Image uploaded");
    },
    [setValue, coverImage]
  );

  const removeImage = useCallback(
    (index: number) => {
      const removed = images[index];
      const updated = images.filter((_, i) => i !== index);
      setValue("images", updated, { shouldValidate: true });
      if (coverImage === removed && updated.length > 0) {
        setValue("coverImage", updated[0], { shouldValidate: true });
      } else if (updated.length === 0) {
        setValue("coverImage", undefined, { shouldValidate: true });
      }
    },
    [images, setValue, coverImage]
  );

  const setCover = useCallback(
    (img: string) => {
      setValue("coverImage", img, { shouldValidate: true });
      toast.success("Cover image updated");
    },
    [setValue]
  );

  return (
    <FormField
      control={control}
      name="images"
      render={() => (
        <FormItem className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-slate-700">Room Photos</FormLabel>
            {images.length > 0 && (
              <span className="text-xs text-slate-500">
                {images.length} photo{images.length > 1 ? "s" : ""} • Click a photo to set as cover
              </span>
            )}
          </div>

          <CloudinaryUpload
            images={images}
            onChange={handleCloudinaryUpload}
            maxFiles={10}
            folder="waghad-villa/rooms"
            hidePreview
          />

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => {
                const isCover = coverImage === img;
                return (
                  <div
                    key={idx}
                    onClick={() => setCover(img)}
                    className={`relative group aspect-square rounded-xl border overflow-hidden bg-slate-50 cursor-pointer transition-all ${
                      isCover ? "ring-2 ring-teal-500 border-teal-300" : "border-slate-100 hover:border-teal-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Room photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isCover && (
                      <div className="absolute top-1.5 left-1.5 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        COVER
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {!isCover && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] font-medium text-center py-1">Set as Cover</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function RoomWizard({ floors, step }: { floors: Floor[]; step: number }) {
  const { control, watch, setValue } = useFormContext<RoomFormValues>();
  const [isNewFloor, setIsNewFloor] = useState(false);
  const sharingType = watch("sharingType");
  const beds = watch("beds");
  const amenities = watch("amenities") || [];
  const wifiName = watch("wifiName");
  const wifiPassword = watch("wifiPassword");

  const handleSharingChange = (value: string) => {
    const count = SHARING_BED_COUNTS[value] || 1;
    const newBeds = Array.from({ length: count }, (_, i) => ({
      name: BED_NAMES[i] || String.fromCharCode(65 + i),
      rent: beds[0]?.rent || 5000,
      deposit: beds[0]?.deposit || 5000,
    }));
    setValue("beds", newBeds, { shouldValidate: true });
  };

  // Step 1: Room Info
  if (step === 1) {
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <FormLabel className="text-slate-700 font-medium">Floor</FormLabel>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isNewFloor}
              onCheckedChange={(v) => {
                setIsNewFloor(v === true);
                if (v === true) {
                  setValue("floorId", undefined);
                } else {
                  setValue("floorName", undefined);
                }
              }}
            />
            <span className="text-sm text-slate-600">Create new floor</span>
          </div>

          {isNewFloor ? (
            <FormField
              control={control}
              name="floorName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="e.g. Ground Floor, First Floor"
                      {...field}
                      className="rounded-xl border-slate-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={control}
              name="floorId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Select existing floor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium">Room Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 101, 201A"
                  {...field}
                  className="rounded-xl border-slate-200"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="sharingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">Sharing Type</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    handleSharingChange(v);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Select sharing" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1-sharing">1-sharing</SelectItem>
                    <SelectItem value="2-sharing">2-sharing</SelectItem>
                    <SelectItem value="3-sharing">3-sharing</SelectItem>
                    <SelectItem value="4-sharing">4-sharing</SelectItem>
                    <SelectItem value="5-sharing">5-sharing</SelectItem>
                    <SelectItem value="6-sharing">6-sharing</SelectItem>
                    <SelectItem value="7-sharing">7-sharing</SelectItem>
                    <SelectItem value="8-sharing">8-sharing</SelectItem>
                    <SelectItem value="9-sharing">9-sharing</SelectItem>
                    <SelectItem value="10-sharing">10-sharing</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="acType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">AC Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Select AC type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="Non-AC">Non-AC</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-6">
          <FormField
            control={control}
            name="mealsIncluded"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                </FormControl>
                <FormLabel className="text-slate-600 font-normal">Meals Included</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="electricityIncluded"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                </FormControl>
                <FormLabel className="text-slate-600 font-normal">
                  Electricity Included
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="showOnHomePage"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 p-4 rounded-xl border border-teal-100 bg-teal-50/50 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              </FormControl>
              <div>
                <FormLabel className="text-slate-800 font-medium text-sm">Show on Home Page</FormLabel>
                <p className="text-xs text-slate-500">Display this room in the Featured Rooms section on the homepage</p>
              </div>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // Step 2: Beds
  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
          <p className="text-sm text-teal-800">
            <span className="font-medium">{beds.length} beds</span> auto-generated for{" "}
            <span className="font-medium">{sharingType}</span>. Edit rent and deposit for each
            bed below.
          </p>
        </div>

        <div className="space-y-3">
          {beds.map((_, index) => (
            <Card key={index} className="rounded-xl border-slate-100 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700">
                    {BED_NAMES[index]}
                  </div>
                  <span className="text-sm font-medium text-slate-700">Bed {index + 1}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={control}
                    name={`beds.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs text-slate-500">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="A"
                            {...field}
                            className="rounded-xl border-slate-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`beds.${index}.rent`}
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs text-slate-500">Rent (Rs.)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="rounded-xl border-slate-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`beds.${index}.deposit`}
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs text-slate-500">Deposit (Rs.)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="rounded-xl border-slate-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <FormMessage>{control._formState.errors.beds?.message}</FormMessage>
      </div>
    );
  }

  // Step 3: Amenities
  if (step === 3) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Select all amenities available in this room.
        </p>
        <FormField
          control={control}
          name="amenities"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-2 gap-3">
                {AMENITIES.map((amenity) => {
                  const isSelected = field.value?.includes(amenity.value);
                  return (
                    <div
                      key={amenity.value}
                      onClick={() => {
                        const current = field.value || [];
                        if (isSelected) {
                          field.onChange(current.filter((v) => v !== amenity.value));
                        } else {
                          field.onChange([...current, amenity.value]);
                        }
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-teal-300 bg-teal-50 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-teal-600 border-teal-600"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <amenity.icon className={`w-5 h-5 ${isSelected ? "text-teal-600" : "text-slate-400"}`} />
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? "text-teal-900" : "text-slate-700"
                        }`}
                      >
                        {amenity.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  // Step 4: Photos
  if (step === 4) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Upload photos of the room. Good photos help guests make decisions faster.
        </p>
        <ImageUploadField />
      </div>
    );
  }

  // Step 5: WiFi + Review
  if (step === 5) {
    const roomName = watch("name");
    const floorId = watch("floorId");
    const floorName = watch("floorName");
    const floorLabel =
      floorName || floors.find((f) => f.id === floorId)?.name || "Not selected";

    return (
      <div className="space-y-5">
        <div className="space-y-4">
          <FormField
            control={control}
            name="wifiName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">WiFi SSID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="WiFi Name"
                    {...field}
                    className="rounded-xl border-slate-200"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="wifiPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">WiFi Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="WiFi Password"
                    {...field}
                    className="rounded-xl border-slate-200"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Review Summary */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">Summary</h4>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-slate-500">Room</span>
            <span className="font-medium text-slate-700">{roomName || "—"}</span>
            <span className="text-slate-500">Floor</span>
            <span className="font-medium text-slate-700">{floorLabel}</span>
            <span className="text-slate-500">Sharing</span>
            <span className="font-medium text-slate-700">{sharingType}</span>
            <span className="text-slate-500">AC</span>
            <span className="font-medium text-slate-700">{watch("acType")}</span>
            <span className="text-slate-500">Beds</span>
            <span className="font-medium text-slate-700">{beds.length}</span>
            <span className="text-slate-500">Amenities</span>
            <span className="font-medium text-slate-700">
              {amenities.length > 0 ? amenities.join(", ") : "None"}
            </span>
            <span className="text-slate-500">Photos</span>
            <span className="font-medium text-slate-700">
              {(watch("images") || []).length} uploaded
              {watch("coverImage") ? " • Cover set" : ""}
            </span>
            <span className="text-slate-500">WiFi</span>
            <span className="font-medium text-slate-700">
              {wifiName ? "Configured" : "Not set"}
            </span>
            <span className="text-slate-500">Home Page</span>
            <span className="font-medium text-slate-700">
              {watch("showOnHomePage") ? "Shown" : "Hidden"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function EditRoomForm({ floors }: { floors: Floor[] }) {
  const { control, watch, setValue } = useFormContext<RoomFormValues>();
  const [isNewFloor, setIsNewFloor] = useState(false);
  const beds = watch("beds");
  const amenities = watch("amenities") || [];

  const handleSharingChange = (value: string) => {
    const count = SHARING_BED_COUNTS[value] || 1;
    const newBeds = Array.from({ length: count }, (_, i) => ({
      name: BED_NAMES[i] || String.fromCharCode(65 + i),
      rent: beds[0]?.rent || 5000,
      deposit: beds[0]?.deposit || 5000,
    }));
    setValue("beds", newBeds, { shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      {/* Floor */}
      <div className="space-y-3">
        <FormLabel className="text-slate-700 font-medium">Floor</FormLabel>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isNewFloor}
            onCheckedChange={(v) => {
              setIsNewFloor(v === true);
              if (v === true) {
                setValue("floorId", undefined);
              } else {
                setValue("floorName", undefined);
              }
            }}
          />
          <span className="text-sm text-slate-600">Create new floor</span>
        </div>

        {isNewFloor ? (
          <FormField
            control={control}
            name="floorName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="e.g. Ground Floor, First Floor"
                    {...field}
                    className="rounded-xl border-slate-200"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={control}
            name="floorId"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Select existing floor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {floors.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        {floor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-medium">Room Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. 101, 201A" {...field} className="rounded-xl border-slate-200" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="sharingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium">Sharing Type</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                  handleSharingChange(v);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select sharing" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1-sharing">1-sharing</SelectItem>
                  <SelectItem value="2-sharing">2-sharing</SelectItem>
                  <SelectItem value="3-sharing">3-sharing</SelectItem>
                  <SelectItem value="4-sharing">4-sharing</SelectItem>
                  <SelectItem value="5-sharing">5-sharing</SelectItem>
                  <SelectItem value="6-sharing">6-sharing</SelectItem>
                  <SelectItem value="7-sharing">7-sharing</SelectItem>
                  <SelectItem value="8-sharing">8-sharing</SelectItem>
                  <SelectItem value="9-sharing">9-sharing</SelectItem>
                  <SelectItem value="10-sharing">10-sharing</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="acType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium">AC Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select AC type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="Non-AC">Non-AC</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex gap-6">
        <FormField
          control={control}
          name="mealsIncluded"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              </FormControl>
              <FormLabel className="text-slate-600 font-normal">Meals Included</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="electricityIncluded"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              </FormControl>
              <FormLabel className="text-slate-600 font-normal">Electricity Included</FormLabel>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="showOnHomePage"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 p-4 rounded-xl border border-teal-100 bg-teal-50/50 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
            </FormControl>
            <div>
              <FormLabel className="text-slate-800 font-medium text-sm">Show on Home Page</FormLabel>
              <p className="text-xs text-slate-500">Display this room in the Featured Rooms section on the homepage</p>
            </div>
          </FormItem>
        )}
      />

      {/* Beds */}
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-semibold text-slate-700">Beds</h4>
        {beds.map((_, index) => (
          <Card key={index} className="rounded-xl border-slate-100 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700">
                  {BED_NAMES[index]}
                </div>
                <span className="text-sm font-medium text-slate-700">Bed {index + 1}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={control}
                  name={`beds.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs text-slate-500">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="A" {...field} className="rounded-xl border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`beds.${index}.rent`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs text-slate-500">Rent (Rs.)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000" {...field} onChange={(e) => field.onChange(Number(e.target.value))} className="rounded-xl border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`beds.${index}.deposit`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs text-slate-500">Deposit (Rs.)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000" {...field} onChange={(e) => field.onChange(Number(e.target.value))} className="rounded-xl border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Amenities */}
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-semibold text-slate-700">Amenities</h4>
        <FormField
          control={control}
          name="amenities"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-2 gap-3">
                {AMENITIES.map((amenity) => {
                  const isSelected = field.value?.includes(amenity.value);
                  return (
                    <div
                      key={amenity.value}
                      onClick={() => {
                        const current = field.value || [];
                        if (isSelected) {
                          field.onChange(current.filter((v) => v !== amenity.value));
                        } else {
                          field.onChange([...current, amenity.value]);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-teal-300 bg-teal-50 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected ? "bg-teal-600 border-teal-600" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <amenity.icon className={`w-5 h-5 ${isSelected ? "text-teal-600" : "text-slate-400"}`} />
                      <span className={`text-sm font-medium ${isSelected ? "text-teal-900" : "text-slate-700"}`}>
                        {amenity.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Photos */}
      <div className="pt-2">
        <ImageUploadField />
      </div>

      {/* WiFi */}
      <div className="space-y-4 pt-2">
        <h4 className="text-sm font-semibold text-slate-700">WiFi Details</h4>
        <FormField
          control={control}
          name="wifiName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium">WiFi SSID</FormLabel>
              <FormControl>
                <Input placeholder="WiFi Name" {...field} className="rounded-xl border-slate-200" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="wifiPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium">WiFi Password</FormLabel>
              <FormControl>
                <Input placeholder="WiFi Password" {...field} className="rounded-xl border-slate-200" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem className="pt-2">
            <FormLabel className="text-slate-700 font-medium">Description (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Additional details about the room..."
                className="rounded-xl border-slate-200 min-h-[80px]"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(1);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      floorId: "",
      floorName: "",
      name: "",
      sharingType: "2-sharing",
      acType: "AC",
      mealsIncluded: false,
      electricityIncluded: false,
      wifiName: "",
      wifiPassword: "",
      amenities: [],
      images: [],
      imagesText: "",
      coverImage: undefined,
      description: "",
      showOnHomePage: false,
      beds: [
        { name: "A", rent: 5000, deposit: 5000 },
        { name: "B", rent: 5000, deposit: 5000 },
      ],
    },
  });

  const fetchFloors = async () => {
    try {
      const res = await fetch("/api/admin/floors");
      if (!res.ok) throw new Error("Failed to fetch floors");
      const data = await res.json();
      setFloors(data);
    } catch {
      toast.error("Failed to fetch floors");
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data: Room[] = await res.json();
      setRooms(data);
    } catch {
      toast.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
    fetchRooms();
  }, []);

  const buildPayload = (values: RoomFormValues) => {
    const urlImages = (values.imagesText || "")
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const images = [...(values.images || []), ...urlImages];
    const payload: Record<string, unknown> = {
      name: values.name,
      sharingType: values.sharingType,
      acType: values.acType,
      mealsIncluded: values.mealsIncluded,
      electricityIncluded: values.electricityIncluded,
      wifiName: values.wifiName || undefined,
      wifiPassword: values.wifiPassword || undefined,
      amenities: values.amenities,
      images,
      coverImage: values.coverImage || undefined,
      description: values.description || undefined,
      showOnHomePage: values.showOnHomePage,
      beds: values.beds,
    };
    if (values.floorId) payload.floorId = values.floorId;
    if (values.floorName) payload.floorName = values.floorName;
    return payload;
  };

  const onSubmit = async (values: RoomFormValues) => {
    try {
      const payload = buildPayload(values);
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create room");
        return;
      }
      toast.success("Room created successfully");
      setIsAddOpen(false);
      setWizardStep(1);
      form.reset({
        floorId: "",
        floorName: "",
        name: "",
        sharingType: "2-sharing",
        acType: "AC",
        mealsIncluded: false,
        electricityIncluded: false,
        wifiName: "",
        wifiPassword: "",
        amenities: [],
        images: [],
        imagesText: "",
        coverImage: undefined,
        description: "",
        showOnHomePage: false,
        beds: [
          { name: "A", rent: 5000, deposit: 5000 },
          { name: "B", rent: 5000, deposit: 5000 },
        ],
      });
      fetchRooms();
      fetchFloors();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onEdit = async (values: RoomFormValues) => {
    if (!selectedRoom) return;
    try {
      const payload = buildPayload(values);
      const res = await fetch("/api/admin/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRoom.id, ...payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update room");
        return;
      }
      toast.success("Room updated successfully");
      setIsEditOpen(false);
      setSelectedRoom(null);
      fetchRooms();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onDelete = async () => {
    if (!selectedRoom) return;
    try {
      const res = await fetch(`/api/admin/rooms?id=${selectedRoom.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to delete room");
        return;
      }
      toast.success("Room deleted successfully");
      setIsDeleteOpen(false);
      setSelectedRoom(null);
      fetchRooms();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const openEdit = (room: Room) => {
    setSelectedRoom(room);
    form.reset({
      floorId: room.floorId,
      floorName: "",
      name: room.name,
      sharingType: room.sharingType as RoomFormValues["sharingType"],
      acType: room.acType as RoomFormValues["acType"],
      mealsIncluded: room.mealsIncluded,
      electricityIncluded: room.electricityIncluded,
      wifiName: room.wifiName || "",
      wifiPassword: room.wifiPassword || "",
      amenities: room.amenities || [],
      images: room.images || [],
      imagesText: "",
      coverImage: room.coverImage || undefined,
      description: room.description || "",
      showOnHomePage: room.showOnHomePage,
      beds: room.beds.map((b) => ({
        name: b.name,
        rent: Number(b.rent),
        deposit: Number(b.deposit),
      })),
    });
    setIsEditOpen(true);
  };

  const openDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteOpen(true);
  };

  const canDeleteRoom = (room: Room) => {
    return room.beds.every((b) => b.status === "Available");
  };

  const canProceed = (step: number): boolean => {
    const values = form.getValues();
    if (step === 1) {
      return !!(
        values.name &&
        (values.floorId || values.floorName) &&
        values.sharingType &&
        values.acType
      );
    }
    if (step === 2) {
      return values.beds.every((b) => b.name && b.rent > 0 && b.deposit > 0);
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rooms</h1>
          <p className="text-sm text-slate-500 mt-1">Manage rooms and beds</p>
        </div>
        <Button
          onClick={() => {
            form.reset({
              floorId: "",
              floorName: "",
              name: "",
              sharingType: "2-sharing",
              acType: "AC",
              mealsIncluded: false,
              electricityIncluded: false,
              wifiName: "",
              wifiPassword: "",
              amenities: [],
              images: [],
              imagesText: "",
              coverImage: undefined,
              description: "",
              showOnHomePage: false,
              beds: [
                { name: "A", rent: 5000, deposit: 5000 },
                { name: "B", rent: 5000, deposit: 5000 },
              ],
            });
            setWizardStep(1);
            setIsAddOpen(true);
          }}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <DataTableSkeleton columns={7} />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No rooms found"
            subtitle="Rooms will appear here once you add them."
          />
        ) : (
          <div className="overflow-x-auto">

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="text-slate-500 font-medium">Room</TableHead>
                <TableHead className="text-slate-500 font-medium">Floor</TableHead>
                <TableHead className="text-slate-500 font-medium">Sharing</TableHead>
                <TableHead className="text-slate-500 font-medium">AC</TableHead>
                <TableHead className="text-slate-500 font-medium">Beds</TableHead>
                <TableHead className="text-slate-500 font-medium">Status</TableHead>
                <TableHead className="text-right text-slate-500 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => {
                const availableBeds = room.beds.filter(
                  (b) => b.status === "Available"
                ).length;
                const isExpanded = expandedRoom === room.id;
                return (
                  <Fragment key={room.id}>
                    <TableRow className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {room.name}
                          {room.images && room.images.length > 0 && (
                            <ImageIcon className="h-3.5 w-3.5 text-teal-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{room.floor.name}</TableCell>
                      <TableCell className="text-slate-600">{room.sharingType}</TableCell>
                      <TableCell className="text-slate-600">{room.acType}</TableCell>
                      <TableCell className="text-slate-600">
                        {availableBeds}/{room._count.beds} available
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            room.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : room.status === "Inactive"
                              ? "bg-slate-100 text-slate-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                                className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isExpanded ? "Collapse" : "Expand"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEdit(room)}
                                className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit room</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openDelete(room)}
                                disabled={!canDeleteRoom(room)}
                                className="rounded-full h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete room</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow
                        key={`${room.id}-expanded`}
                        className="bg-slate-50/50"
                      >
                        <TableCell colSpan={7} className="py-4">
                          <div className="pl-4 pr-4">
                            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                              Beds
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {room.beds.map((bed) => (
                                <div
                                  key={bed.id}
                                  className={`text-xs px-3 py-2 rounded-xl border ${
                                    bed.status === "Available"
                                      ? "bg-green-50 border-green-200 text-green-700"
                                      : bed.status === "Occupied"
                                      ? "bg-red-50 border-red-200 text-red-700"
                                      : "bg-amber-50 border-amber-200 text-amber-700"
                                  }`}
                                >
                                  <span className="font-medium">{bed.name}</span>
                                  <span className="mx-1">Â·</span>
                                  <span>{formatCurrency(bed.rent)}</span>
                                  <span className="mx-1">Â·</span>
                                  <span>{bed.status}</span>
                                </div>
                              ))}
                            </div>
                            {room.amenities.length > 0 && (
                              <p className="text-xs text-slate-500 mt-3">
                                Amenities: {room.amenities.join(", ")}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>

          </div>
        )}
      </div>

      {/* Add Room Wizard Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Add Room
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Step {wizardStep} of 5 — {STEPS[wizardStep - 1].label}
            </DialogDescription>
          </DialogHeader>

          <StepIndicator currentStep={wizardStep} totalSteps={5} />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <RoomWizard floors={floors} step={wizardStep} />

              <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
                {wizardStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="rounded-full border-slate-200"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                {wizardStep < 5 && (
                  <Button
                    type="button"
                    onClick={() => {
                      if (canProceed(wizardStep)) {
                        setWizardStep(wizardStep + 1);
                      } else {
                        toast.error("Please fill in all required fields");
                      }
                    }}
                    className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {wizardStep === 5 && (
                  <Button
                    type="submit"
                    className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create Room
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog — keep tabs for edit, wizard only for add */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Edit Room
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Update room details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
              <EditRoomForm floors={floors} />
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-full border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Update
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-slate-900">
              Delete Room
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete{" "}
              <strong>{selectedRoom?.name}</strong>?
              {selectedRoom && !canDeleteRoom(selectedRoom) && (
                <span className="mt-2 block text-red-600">
                  This room has occupied or reserved beds and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-full border-slate-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={!!selectedRoom && !canDeleteRoom(selectedRoom)}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
