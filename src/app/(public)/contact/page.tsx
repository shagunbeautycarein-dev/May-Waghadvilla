import { Suspense } from "react";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getCmsSettings } from "@/lib/cms";
import { generateSEO } from "@/lib/seo";
import { InquiryForm } from "@/components/public/inquiry-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = generateSEO({
  title: "Contact Us",
  description:
    "Book a visit to The Waghad Villa PG in Ambawadi Ahmedabad. Call or WhatsApp us to schedule your tour today.",
  path: "/contact",
});

function InquiryFormSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default async function ContactPage() {
  const cms = await getCmsSettings();
  const phone = cms["cms_contact_phone"] || siteConfig.contact.phone;
  const email = cms["cms_contact_email"] || siteConfig.contact.email;
  const address = cms["cms_contact_address"] || siteConfig.contact.address;
  const whatsapp = cms["cms_contact_phone"] || siteConfig.contact.whatsapp;
  const mapEmbed = cms["cms_contact_map"] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Contact Us
        </h1>
        <p className="mt-3 text-slate-600 max-w-xl mx-auto">
          Book your free visit or reach out with any questions. We are here to
          help you find your perfect stay.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left — Inquiry Form */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 tracking-tight">
            Send an Inquiry
          </h2>
          <Suspense fallback={<InquiryFormSkeleton />}>
            <InquiryForm />
          </Suspense>
        </div>

        {/* Right — Contact Info */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Get in Touch
            </h2>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Phone</p>
                <a
                  href={`tel:${phone}`}
                  className="text-sm text-slate-600 hover:text-teal-700 transition-colors"
                >
                  {phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Email</p>
                <a
                  href={`mailto:${email}`}
                  className="text-sm text-slate-600 hover:text-teal-700 transition-colors"
                >
                  {email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Address</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {address}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">WhatsApp</p>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-teal-700 transition-colors"
                >
                  {whatsapp}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Visiting Hours
              </h3>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Morning: 9:00 AM – 12:00 PM</p>
              <p>Afternoon: 12:00 PM – 4:00 PM</p>
              <p>Evening: 4:00 PM – 8:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mt-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.0!2d72.5714!3d23.0225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDAxJzIxLjAiTiA3MsKwMzQnMTcuMCJF!5e0!3m2!1sen!2sin!4v1"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="The Waghad Villa location map"
        />
      </div>
    </div>
  );
}
