"use client";

import { useEffect, useState, useCallback, useId } from "react";
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
  Eye,
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
  if (!data.secure_url) {
    throw new Error("Upload response missing URL");
  }
  return data.secure_url as string;
}

/* ------------------------------------------------------------------ */
/*  Reusable sub-components (defined outside main to keep refs stable)  */
/* ------------------------------------------------------------------ */

function ImageField({
  label,
  keyName,
  placeholder,
  url,
  isUploading,
  onChange,
  onUpload,
}: {
  label: string;
  keyName: string;
  placeholder?: string;
  url: string;
  isUploading: boolean;
  onChange: (val: string) => void;
  onUpload: (file: File) => void;
}) {
  const inputId = useId();

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-600">{label}</Label>

      {url && (
        <div className="relative w-fit max-w-full group">
          <img
            src={url}
            alt={label}
            className="h-24 max-w-xs object-contain rounded-lg border border-slate-100 bg-white"
            onError={() => toast.error(`Failed to load ${label} preview`)}
          />
          <button
            type="button"
            onClick={() => onChange("")}
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
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border-slate-200"
        />
        <input
          id={inputId}
          type="file"
          hidden
          accept="image/jpeg,image/png,image/webp,image/jpg,image/svg+xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            // reset so same file can be selected again
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => document.getElementById(inputId)?.click()}
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
}

function Field({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border-slate-200"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function CMSPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("logo");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputId = useId();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSettings(data);
      try {
        const parsed = JSON.parse(data.cms_gallery_images || "[]");
        setGalleryImages(Array.isArray(parsed) ? parsed : []);
      } catch {
        setGalleryImages([]);
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

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

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
      toast.success(`${keyName.replace("cms_", "")} uploaded successfully`);
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingKey(null);
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
      console.error("Gallery upload error:", e);
      toast.error(e.message || "Gallery upload failed");
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">CMS</h1>
          <p className="text-sm text-slate-500 mt-1">Manage website content</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-brand-600 hover:bg-brand-700 text-white h-10 px-5"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Save
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                isActive
                  ? "bg-brand-50 border-brand-200 text-brand-700"
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
        {/* ---------- LOGO ---------- */}
        {activeTab === "logo" && (
          <div className="space-y-5 max-w-lg">
            <ImageField
              label="Logo URL"
              keyName="cms_logo"
              placeholder="https://..."
              url={settings.cms_logo || ""}
              isUploading={uploadingKey === "cms_logo"}
              onChange={(v) => updateSetting("cms_logo", v)}
              onUpload={(file) => handleSingleUpload("cms_logo", file)}
            />
            <ImageField
              label="Favicon URL"
              keyName="cms_favicon"
              placeholder="https://..."
              url={settings.cms_favicon || ""}
              isUploading={uploadingKey === "cms_favicon"}
              onChange={(v) => updateSetting("cms_favicon", v)}
              onUpload={(file) => handleSingleUpload("cms_favicon", file)}
            />

            {/* Live preview */}
            {(settings.cms_logo || settings.cms_favicon) && (
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Preview</p>
                {settings.cms_logo && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16">Logo</span>
                    <img src={settings.cms_logo} alt="Logo preview" className="h-12 object-contain" />
                  </div>
                )}
                {settings.cms_favicon && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16">Favicon</span>
                    <img src={settings.cms_favicon} alt="Favicon preview" className="h-8 w-8 object-contain rounded" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------- HERO ---------- */}
        {activeTab === "hero" && (
          <div className="space-y-5 max-w-lg">
            <ImageField
              label="Hero Image URL"
              keyName="cms_hero_image"
              placeholder="https://..."
              url={settings.cms_hero_image || ""}
              isUploading={uploadingKey === "cms_hero_image"}
              onChange={(v) => updateSetting("cms_hero_image", v)}
              onUpload={(file) => handleSingleUpload("cms_hero_image", file)}
            />
            <Field
              label="Hero Tagline"
              value={settings.cms_hero_tagline || ""}
              placeholder="Welcome to The Waghad Villa"
              onChange={(v) => updateSetting("cms_hero_tagline", v)}
            />
            <Field
              label="Hero Subtitle"
              value={settings.cms_hero_subtitle || ""}
              placeholder="Premium PG accommodation in Ahmedabad"
              onChange={(v) => updateSetting("cms_hero_subtitle", v)}
            />
            {settings.cms_hero_image && (
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <img src={settings.cms_hero_image} alt="Hero preview" className="w-full h-48 object-cover" />
              </div>
            )}
          </div>
        )}

        {/* ---------- ABOUT ---------- */}
        {activeTab === "about" && (
          <div className="space-y-5 max-w-lg">
            <Field
              label="About Text"
              value={settings.cms_about_text || ""}
              type="textarea"
              placeholder="Write about your PG..."
              onChange={(v) => updateSetting("cms_about_text", v)}
            />
            <ImageField
              label="About Image URL"
              keyName="cms_about_image"
              placeholder="https://..."
              url={settings.cms_about_image || ""}
              isUploading={uploadingKey === "cms_about_image"}
              onChange={(v) => updateSetting("cms_about_image", v)}
              onUpload={(file) => handleSingleUpload("cms_about_image", file)}
            />
            {settings.cms_about_image && (
              <img src={settings.cms_about_image} alt="About preview" className="w-full h-48 object-cover rounded-xl" />
            )}
          </div>
        )}

        {/* ---------- CONTACT ---------- */}
        {activeTab === "contact" && (
          <div className="space-y-5 max-w-lg">
            <Field label="Phone" value={settings.cms_contact_phone || ""} placeholder="+91 98765 43210" onChange={(v) => updateSetting("cms_contact_phone", v)} />
            <Field label="WhatsApp" value={settings.cms_contact_whatsapp || ""} placeholder="+91 98765 43210" onChange={(v) => updateSetting("cms_contact_whatsapp", v)} />
            <Field label="Email" value={settings.cms_contact_email || ""} placeholder="info@wahadvilla.com" onChange={(v) => updateSetting("cms_contact_email", v)} />
            <Field label="Address" value={settings.cms_contact_address || ""} type="textarea" placeholder="Full address..." onChange={(v) => updateSetting("cms_contact_address", v)} />
            <Field label="Google Map Embed URL" value={settings.cms_contact_map || ""} placeholder="https://www.google.com/maps/embed..." onChange={(v) => updateSetting("cms_contact_map", v)} />

            {settings.cms_contact_map && (
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <iframe
                  src={settings.cms_contact_map}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location map"
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* ---------- GALLERY ---------- */}
        {activeTab === "gallery" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Gallery Images <span className="text-slate-400 font-normal">({galleryImages.length}/20)</span>
              </h3>
              <div className="flex items-center gap-2">
                <input
                  id={galleryInputId}
                  type="file"
                  hidden
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => {
                    if (e.target.files) handleGalleryUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById(galleryInputId)?.click()}
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

        {/* ---------- SOCIAL ---------- */}
        {activeTab === "social" && (
          <div className="space-y-5 max-w-lg">
            <Field label="Facebook URL" value={settings.cms_social_facebook || ""} placeholder="https://facebook.com/..." onChange={(v) => updateSetting("cms_social_facebook", v)} />
            <Field label="Instagram URL" value={settings.cms_social_instagram || ""} placeholder="https://instagram.com/..." onChange={(v) => updateSetting("cms_social_instagram", v)} />
            <Field label="Twitter URL" value={settings.cms_social_twitter || ""} placeholder="https://twitter.com/..." onChange={(v) => updateSetting("cms_social_twitter", v)} />
            <Field label="LinkedIn URL" value={settings.cms_social_linkedin || ""} placeholder="https://linkedin.com/..." onChange={(v) => updateSetting("cms_social_linkedin", v)} />
          </div>
        )}
      </div>

      {/* Floating preview link */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="rounded-full border-slate-200 text-slate-600"
        >
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview Website
          </a>
        </Button>
      </div>
    </div>
  );
}
