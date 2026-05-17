import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { FloatingActionButtons } from "@/components/public/floating-buttons";
import { getCmsSettings } from "@/lib/cms";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cms = await getCmsSettings();
  const logoUrl = cms["cms_logo"] || "";

  return (
    <div className="min-h-screen bg-white">
      <Navbar logoUrl={logoUrl} />
      <main>{children}</main>
      <Footer />
      <FloatingActionButtons />
    </div>
  );
}
