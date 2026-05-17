import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { ContactFAB } from "@/components/public/contact-fab";
import { CTAPopup } from "@/components/public/cta-popup";
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
      <ContactFAB />
      <CTAPopup />
    </div>
  );
}
