"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Image,
  Type,
  Info,
  Phone,
  Camera,
  Share2,
  X,
  Plus,
  Upload,
} from "lucide-react";

const TABS = [
  { key: "logo", label: "Logo", icon: Image },
  { key: "hero", label: "Hero", icon: Type },
  { key: "about", label: "About", icon: Info },
  { key: "contact", label: "Contact", icon: Phone },
  { key: "gallery", label: "Gallery", icon: Camera },
  { key: "social", label: "Social", icon: Share2 },
];

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = "wahad_villa_unsigned";

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary cloud name not configured");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${err}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}

export default function CMSPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("logo");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        try {
          const parsed = JSON.parse(data.cms_gallery_images || "[]");
          setGalleryImages(Array.isArray(parsed) ? parsed : []);
        } catch {
          setGalleryImages([]);
        }
      } else {
        toast.error("Failed to load CMS settings");
      }
    } catch {
      toast.error("Failed to load CMS settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        cms_gallery_images: JSON.stringify(galleryImages),
      };
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("CMS settings saved");
    } catch {
      toast.error("Failed to save CMS settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSingleUpload = async (keyName: string, file: File) => {
    setUploadingKey(keyName);
    try {
      const url = await uploadToCloudinary(file, "wahad-villa/cms");
      updateSetting(keyName, url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingKey(null);
      const input = fileInputRefs.current[keyName];
      if (input) input.value = "";
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    if (galleryImages.length >= 20) {
      toast.error("Maximum 20 gallery images allowed");
      return;
    }
    setUploadingGallery(true);
    const urls: string[] = [];
    const remaining = 20 - galleryImages.length;
    const toUpload = Array.from(files).slice(0, remaining);

    try {
      for (const file of toUpload) {
        const url = await uploadToCloudinary(file, "wahad-villa/cms");
        urls.push(url);
      }
      if (urls.length > 0) {
        setGalleryImages((prev) => [...prev, ...urls]);
        toast.success(`${urls.length} image(s) added to gallery`);
      }
    } catch (e: any) {
      toast.error(e.message || "Gallery upload failed");
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const ImageField = ({
    label,
    keyName,
    placeholder,
  }: {
    label: string;
    keyName: string;
    placeholder?: string;
  }) => {
    const url = settings[keyName] || "";
    const isUploading = uploadingKey === keyName;
    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">{label}</Label>
        {url && (
          <div className="relative w-fit max-w-full group">
            <img
              src={url}
              alt={label}
              className="h-20 max-w-xs object-contain rounded-lg border border-slate-100 bg-white"
            />
            <button
              type="button"
              onClick={() => updateSetting(keyName, "")}
              className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              title="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={url}
            onChange={(e) => updateSetting(keyName, e.target.value)}
            placeholder={placeholder}
            className="rounded-xl border-slate-200"
          />
          <input
            type="file"
            ref={(el) => { fileInputRefs.current[keyName] = el; }}
            hidden
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSingleUpload(keyName, file);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRefs.current[keyName]?.click()}
            disabled={isUploading}
            className="rounded-full border-slate-200 h-9 px-3 shrink-0"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1" />
            )}
            {isUploading ? "Uploading" : "Upload"}
          </Button>
        </div>
      </div>
    );
  };

  const Field = ({
    label,
    keyName,
    type = "text",
    placeholder,
  }: {
    label: string;
    keyName: string;
    type?: string;
    placeholder?: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      {type === "textarea" ? (
        <textarea
          value={settings[keyName] || ""}
          onChange={(e) => updateSetting(keyName, e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
        />
      ) : (
        <Input
          type={type}
          value={settings[keyName] || ""}
          onChange={(e) => updateSetting(keyName, e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border-slate-200"
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">CMS</h1>
          <p className="text-sm text-slate-500 mt-1">Manage website content</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-10 px-5"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Save
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activeTab === tab.key
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 md:p-6 space-y-5">
        {activeTab === "logo" && (
          <div className="space-y-5 max-w-lg">
            <ImageField label="Logo URL" keyName="cms_logo" placeholder="https://..." />
            <ImageField label="Favicon URL" keyName="cms_favicon" placeholder="https://..." />
          </div>
        )}

        {activeTab === "hero" && (
          <div className="space-y-5 max-w-lg">
            <ImageField label="Hero Image URL" keyName="cms_hero_image" placeholder="https://..." />
            <Field label="Hero Tagline" keyName="cms_hero_tagline" placeholder="Welcome to The Waghad Villa" />
            <Field label="Hero Subtitle" keyName="cms_hero_subtitle" placeholder="Premium PG accommodation in Ahmedabad" />
            {settings.cms_hero_image && (
              <img src={settings.cms_hero_image} alt="Hero preview" className="w-full h-48 object-cover rounded-xl" />
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-5 max-w-lg">
            <Field label="About Text" keyName="cms_about_text" type="textarea" placeholder="Write about your PG..." />
            <ImageField label="About Image URL" keyName="cms_about_image" placeholder="https://..." />
            {settings.cms_about_image && (
              <img src={settings.cms_about_image} alt="About preview" className="w-full h-48 object-cover rounded-xl" />
            )}
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-5 max-w-lg">
            <Field label="Phone" keyName="cms_contact_phone" placeholder="+91 98765 43210" />
            <Field label="WhatsApp" keyName="cms_contact_whatsapp" placeholder="+91 98765 43210" />
            <Field label="Email" keyName="cms_contact_email" placeholder="info@wahadvilla.com" />
            <Field label="Address" keyName="cms_contact_address" type="textarea" placeholder="Full address..." />
            <Field label="Google Map Embed URL" keyName="cms_contact_map" placeholder="https://www.google.com/maps/embed..." />
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Gallery Images <span className="text-slate-400 font-normal">({galleryImages.length}/20)</span>
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={galleryInputRef}
                  hidden
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => {
                    if (e.target.files) handleGalleryUpload(e.target.files);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery || galleryImages.length >= 20}
                  className="rounded-full border-slate-200"
                >
                  {uploadingGallery ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 mr-1" />
                  )}
                  {uploadingGallery ? "Uploading" : "Add Image"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {galleryImages.map((url, i) => (
                <div key={`${url}-${i}`} className="relative group">
                  <img
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            {galleryImages.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No images added yet</p>
            )}
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-5 max-w-lg">
            <Field label="Facebook URL" keyName="cms_social_facebook" placeholder="https://facebook.com/..." />
            <Field label="Instagram URL" keyName="cms_social_instagram" placeholder="https://instagram.com/..." />
            <Field label="Twitter URL" keyName="cms_social_twitter" placeholder="https://twitter.com/..." />
            <Field label="LinkedIn URL" keyName="cms_social_linkedin" placeholder="https://linkedin.com/..." />
          </div>
        )}
      </div>
    </div>
  );
}
