"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";

interface CloudinaryUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  folder?: string;
  accept?: string;
  hidePreview?: boolean;
}

export function CloudinaryUpload({
  images,
  onChange,
  maxFiles = 5,
  folder = "waghad-villa",
  accept,
  hidePreview = false,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    const uploadedUrls: string[] = [];

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      setError("Cloudinary configuration missing");
      setUploading(false);
      return;
    }

    try {
      const remainingSlots = maxFiles - images.length;
      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "wahad_villa_unsigned";

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          const msg = errorData.error?.message || "Upload failed";
          if (msg.toLowerCase().includes("upload preset not found")) {
            throw new Error(
              "Cloudinary upload preset 'wahad_villa_unsigned' not found. Go to Cloudinary Dashboard → Settings → Upload → Upload Presets → Add New. Name it 'wahad_villa_unsigned', set Signing Mode to 'Unsigned', and save."
            );
          }
          throw new Error(msg);
        }

        const data = await res.json();
        uploadedUrls.push(data.secure_url);
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
      }
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {!hidePreview && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-slate-200"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxFiles && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            multiple={maxFiles > 1}
            accept={accept || "image/jpeg,image/png,image/jpg,application/pdf"}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={uploading}
            className="w-full h-24 border-dashed border-2 border-slate-300 hover:border-teal-500 hover:bg-teal-50 transition-colors rounded-xl"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            {uploading ? "Uploading..." : `Upload Image${maxFiles > 1 ? "s" : ""}`}
          </Button>
        </>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Max {maxFiles} files, 5MB each. JPG, PNG, PDF accepted.
      </p>
    </div>
  );
}
