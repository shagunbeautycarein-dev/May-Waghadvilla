import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { FloatingActionButtons } from "@/components/public/floating-buttons";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <FloatingActionButtons />
    </div>
  );
}
