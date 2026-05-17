import { unstable_noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-safe";

const CMS_KEYS = [
  "cms_logo",
  "cms_favicon",
  "cms_hero_image",
  "cms_hero_tagline",
  "cms_hero_subtitle",
  "cms_about_text",
  "cms_about_image",
  "cms_contact_phone",
  "cms_contact_email",
  "cms_contact_address",
  "cms_contact_map",
  "cms_contact_whatsapp",
  "cms_gallery_images",
  "cms_social_facebook",
  "cms_social_instagram",
  "cms_social_twitter",
  "cms_social_linkedin",
];

export type CmsSettings = Record<string, string>;

export async function getCmsSettings(): Promise<CmsSettings> {
  unstable_noStore();
  const settings = await safeQuery(
    async () =>
      prisma.setting.findMany({
        where: { key: { in: CMS_KEYS } },
      }),
    []
  );

  const result: CmsSettings = {};
  settings.forEach((s) => {
    result[s.key] = s.value || "";
  });
  return result;
}

export function getGalleryImages(settings: CmsSettings): string[] {
  const raw = settings["cms_gallery_images"] || "[]";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((i) => typeof i === "string" && i.trim());
    return [];
  } catch {
    return [];
  }
}
