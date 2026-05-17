import { Users, Building2, DoorOpen, Check } from "lucide-react";
import { getCmsSettings } from "@/lib/cms";
import { generateSEO } from "@/lib/seo";

export const metadata = generateSEO({
  title: "About Us",
  description:
    "Learn about The Waghad Villa — premium PG accommodation in Ambawadi Ahmedabad for students and working professionals.",
  path: "/about",
});

const stats = [
  { icon: Users, label: "Happy Guests", value: "50+" },
  { icon: Building2, label: "Floors", value: "3" },
  { icon: DoorOpen, label: "Rooms", value: "6+" },
];

const reasons = [
  "Fully furnished AC & Non-AC rooms",
  "High-speed WiFi in all rooms",
  "Homely meals (breakfast, lunch & dinner)",
  "24/7 security with CCTV surveillance",
  "Daily housekeeping & laundry service",
  "RO drinking water & hot water geyser",
  "Prime location in Ambawadi, Ahmedabad",
  "Flexible sharing options (1 to 4 sharing)",
];

export default async function AboutPage() {
  const cms = await getCmsSettings();
  const aboutText =
    cms["cms_about_text"] ||
    "The Waghad Villa is a premium paying guest accommodation located in the heart of Ambawadi, Ahmedabad. We provide a safe, comfortable, and homely environment for students and working professionals. With modern amenities, delicious home-cooked meals, and a prime location near Vijay Cross Road and Law Garden, we strive to make your stay feel like home.";
  const aboutImage = cms["cms_about_image"] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          About The Waghad Villa
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed">{aboutText}</p>
      </div>

      {aboutImage && (
        <div className="mb-12 rounded-xl overflow-hidden border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={aboutImage}
            alt="The Waghad Villa"
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <Icon className="w-7 h-7" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            <span className="text-sm text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Why Choose Us */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
            Why Choose The Waghad Villa?
          </h2>
          <ul className="space-y-4">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-3 text-slate-700">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50">
                  <Check className="w-3 h-3 text-teal-700" />
                </div>
                <span className="text-sm leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Location</h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            Situated in Ambawadi, one of the most well-connected localities in
            Ahmedabad, The Waghad Villa offers easy access to major landmarks:
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Vijay Cross Road — 1.2 km</li>
            <li>• Law Garden — 1.5 km</li>
            <li>• CG Road — 2.0 km</li>
            <li>• Ellisbridge — 1.8 km</li>
            <li>• Paldi Station — 2.8 km</li>
            <li>• Gujarat University — 3.5 km</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
