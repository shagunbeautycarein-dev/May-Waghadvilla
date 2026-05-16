import { generateSEO } from "@/lib/seo";

export const metadata = generateSEO({
  title: "Rooms & Pricing",
  description:
    "Explore our AC rooms with WiFi and meals. Single, double, and triple sharing options available in Ambawadi Ahmedabad.",
  path: "/rooms",
});

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
