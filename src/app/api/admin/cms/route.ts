import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CMS_KEYS = [
  "cms_logo", "cms_favicon", "cms_hero_image", "cms_hero_tagline",
  "cms_hero_subtitle", "cms_about_text", "cms_about_image",
  "cms_contact_phone", "cms_contact_email", "cms_contact_address",
  "cms_contact_map", "cms_contact_whatsapp", "cms_gallery_images", "cms_social_facebook",
  "cms_social_instagram", "cms_social_twitter", "cms_social_linkedin",
];

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: CMS_KEYS } },
    });

    const result: Record<string, string> = {};
    settings.forEach((s) => {
      result[s.key] = s.value || "";
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("GET /api/admin/cms error:", e);
    return NextResponse.json(
      { error: "Failed to fetch CMS settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      if (!CMS_KEYS.includes(key)) continue;
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value), category: "cms" },
        create: { key, value: String(value), category: "cms" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("POST /api/admin/cms error:", e);
    return NextResponse.json(
      { error: "Failed to save CMS settings" },
      { status: 500 }
    );
  }
}
