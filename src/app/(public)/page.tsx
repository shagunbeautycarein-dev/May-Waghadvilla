import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-safe";
import { getCmsSettings } from "@/lib/cms";
import Image from "next/image";

export const dynamic = "force-dynamic";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Wifi,
  Star,
  MapPin,
  ArrowRight,
  Clock,
  Shield,
  Coffee,
  ChevronRight,
  Users,
  Zap,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { TestimonialCarousel } from "@/components/public/testimonial-carousel";
import { WhyChooseCompact } from "@/components/public/why-choose-compact";
import { StickyBookCTA } from "@/components/public/sticky-book-cta";

const stats = [
  { label: "Happy Residents", value: "30+" },
  { label: "Google Rating", value: "4.7★" },
  { label: "Safety Score", value: "100%" },
];

interface Floor {
  name: string;
}

interface Bed {
  id: string;
  status: string;
  rent: number | string;
}

interface Room {
  id: string;
  name: string;
  sharingType: string;
  acType: string;
  mealsIncluded: boolean;
  floor: Floor;
  beds: Bed[];
  images: string[];
  coverImage: string | null;
}

export const metadata = {
  title: "Premium Flatmate Matching PG in Ambawadi | Waghad Villa",
  description:
    "Smart flatmate matching + all-inclusive room sharing for working professionals in Ambawadi, Ahmedabad. 5-min walk to Shreyas Metro & Parimal Garden. Electricity, WiFi, water & maintenance included. Flexible leaving policy. Book your room today.",
  keywords: [
    "flatmate Ambawadi",
    "room sharing working professionals Ahmedabad",
    "premium flatmate matching Ambawadi",
    "all inclusive PG near Parimal Garden",
    "flexible leaving PG Ambawadi",
    "metro walking distance PG Ahmedabad",
    "working professionals accommodation Ambawadi",
    "peaceful room sharing Ahmedabad",
    "PG with WiFi electricity included Ambawadi",
    "easy move out PG Ahmedabad",
  ],
  openGraph: {
    title: "Premium Flatmate Matching PG in Ambawadi | Waghad Villa",
    description: "Smart flatmate matching + all-inclusive living for working professionals. 5-min walk to Shreyas Metro.",
    type: "website",
  },
};

export default async function HomePage() {
  const rooms = await safeQuery(
    async () =>
      (await prisma.room.findMany({
        where: { status: "Active", deletedAt: null },
        select: {
          id: true,
          name: true,
          sharingType: true,
          acType: true,
          mealsIncluded: true,
          images: true,
          coverImage: true,
          floor: true,
          beds: { where: { deletedAt: null } },
        },
        take: 3,
      })) as unknown as Room[],
    []
  );

  const cms = await getCmsSettings();
  const heroImage = cms["cms_hero_image"] || "/images/hero.png";
  const heroTagline = cms["cms_hero_tagline"] || "✨ Premium Living Experience in Ahmedabad";
  const heroSubtitle = cms["cms_hero_subtitle"] || "Smart Flatmate Matching · All Inclusive Amenities · Flexible Leaving Policy for Working Professionals near Parimal Garden";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            name: "The Waghad Villa",
            description: "Premium PG with smart flatmate matching for working professionals in Ambawadi, Ahmedabad. All-inclusive amenities with flexible leaving policy.",
            url: siteConfig.url,
            telephone: siteConfig.contact.phone,
            email: siteConfig.contact.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: "Near Parimal Garden, Ambawadi",
              addressLocality: "Ahmedabad",
              addressRegion: "Gujarat",
              postalCode: "380006",
              addressCountry: "IN",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "23.0225",
              longitude: "72.5714",
            },
            priceRange: "₹₹",
            audience: {
              "@type": "Audience",
              audienceType: "Working Professionals",
            },
            amenityFeature: [
              { "@type": "LocationFeatureSpecification", name: "Flatmate Matching", value: true },
              { "@type": "LocationFeatureSpecification", name: "All Inclusive Rent", value: true },
              { "@type": "LocationFeatureSpecification", name: "High Speed WiFi", value: true },
              { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
              { "@type": "LocationFeatureSpecification", name: "Flexible Leaving Policy", value: true },
              { "@type": "LocationFeatureSpecification", name: "Near Metro Station", value: true },
            ],
            image: siteConfig.ogImage,
            openingHoursSpecification: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              opens: "00:00",
              closes: "23:59",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is flatmate matching at The Waghad Villa?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Our flatmate matching system pairs you with compatible roommates based on your work schedule, lifestyle preferences, and habits. This ensures a peaceful, drama-free living environment for all working professionals.",
                },
              },
              {
                "@type": "Question",
                name: "Is this PG suitable for working professionals in Ambawadi?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, The Waghad Villa is specifically designed for working professionals. We offer all-inclusive amenities, high-speed WiFi, quiet hours, and a location just 5 minutes from Shreyas Metro Station and major office hubs on CG Road.",
                },
              },
              {
                "@type": "Question",
                name: "What does all-inclusive rent cover?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Our all-inclusive rent covers electricity, water, high-speed WiFi, maintenance, housekeeping, and laundry. You pay one fixed amount per month with no surprise bills or hidden charges.",
                },
              },
              {
                "@type": "Question",
                name: "How flexible is the leaving policy?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We understand that job changes and transfers happen. Our flexible leaving policy requires only a reasonable notice period. We process deposit refunds within 15 days of move-out after a quick room inspection.",
                },
              },
              {
                "@type": "Question",
                name: "How far is The Waghad Villa from Shreyas Metro Station?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The Waghad Villa is a 5-minute walk from Shreyas Metro Station on the Ahmedabad Metro line. Parimal Garden is just 3 minutes away, and CG Road commercial area is 7 minutes away.",
                },
              },
              {
                "@type": "Question",
                name: "Do you offer single room or only room sharing?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We offer both options. You can choose a private single room for complete privacy, or opt for 2-sharing to 10-sharing rooms with professionally matched flatmates. All rooms are fully furnished and air-conditioned.",
                },
              },
              {
                "@type": "Question",
                name: "What is the rent for room sharing in Ambawadi?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Room sharing at The Waghad Villa starts from ₹6,500 per month depending on sharing type (1-sharing to 10-sharing). All prices are inclusive of electricity, water, WiFi, and maintenance.",
                },
              },
              {
                "@type": "Question",
                name: "Is the PG near Parimal Garden and CG Road?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, The Waghad Villa is located in Ambawadi, just 3 minutes from Parimal Garden and 7 minutes from CG Road — Ahmedabad's main commercial and business district. This makes it ideal for working professionals.",
                },
              },
              {
                "@type": "Question",
                name: "Can I get a rent receipt for my company reimbursement?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Absolutely. We provide digital rent receipts and payment confirmations for every transaction. You can download them from your guest dashboard and submit them for HRA reimbursement at your company.",
                },
              },
              {
                "@type": "Question",
                name: "How do I book a room or schedule a visit?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can book a free visit through our website by clicking the Book Visit button, or call us directly. We offer both in-person and virtual tours. Once you choose your room, our digital onboarding process gets you moved in within 24 hours.",
                },
              },
            ],
          }),
        }}
      />
      <main className="flex flex-col min-h-screen bg-slate-50/30">
        {/* Hero Section */}
        <header aria-label="Hero" className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              priority
              fill
              src={heroImage}
              alt="The Waghad Villa Hero"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#1F2937]/70 md:bg-gradient-to-r md:from-[#1F2937]/90 md:via-[#1F2937]/60 md:to-transparent" />
          </div>

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-3xl animate-reveal text-center md:text-left mx-auto md:mx-0">
              <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium">
                {heroTagline}
              </Badge>
              <Badge className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium">
                For Working Professionals
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight drop-shadow-xl">
                Premium PG with Flatmate Matching in Ambawadi Ahmedabad – 5 Min Walk to Metro
              </h1>
              <p className="mt-8 text-xl text-slate-200 leading-relaxed max-w-2xl font-light drop-shadow-md">
                {heroSubtitle}
              </p>

              <div className="mt-12 flex flex-col sm:flex-row gap-5 items-center md:items-start justify-center md:justify-start">
                <div className="relative inline-block">
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-bounce">
                    Free
                  </span>
                  <Button
                    asChild
                    size="lg"
                    className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 group"
                  >
                    <Link href="/contact" className="flex items-center gap-2">
                      Book Visit Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 rounded-2xl border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-all"
                >
                  <Link href="/rooms">Explore Rooms</Link>
                </Button>
              </div>

              <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-emerald-400">{stat.value}</div>
                    <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Decorative Elements */}
          <div className="absolute bottom-10 right-10 hidden lg:block animate-float">
            <div className="glass p-6 rounded-3xl shadow-2xl flex items-center gap-4 max-w-xs">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">24/7 Security</p>
                <p className="text-xs text-slate-500">Safe & Secure Environment</p>
              </div>
            </div>
          </div>
        </header>

        {/* Section A: Why Working Professionals Love */}
        <section className="py-12 bg-emerald-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Why Working Professionals Love The Waghad Villa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* USP 1: Flatmate Matching */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Smart Flatmate Matching</h3>
                <p className="text-sm text-gray-600">
                  We match you with compatible flatmates based on lifestyle, work schedule, and preferences — so you enjoy a peaceful, drama-free stay.
                </p>
              </div>

              {/* USP 2: All Inclusive */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-lg mb-2">All Inclusive Living</h3>
                <p className="text-sm text-gray-600">
                  Electricity, water, high-speed WiFi, and maintenance — all included in your monthly rent. No surprise bills, no separate calculations.
                </p>
              </div>

              {/* USP 3: Flexible Leaving */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Flexible Leaving Policy</h3>
                <p className="text-sm text-gray-600">
                  Life changes. We get it. Our easy move-out process and reasonable notice period give you the freedom to leave without stress.
                </p>
              </div>

              {/* USP 4: Prime Location */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-lg mb-2">5 Min Walk to Metro</h3>
                <p className="text-sm text-gray-600">
                  Shreyas Metro Station is a 5-minute walk away. Parimal Garden is your neighborhood green space. CG Road and major offices are minutes away.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section C: Flatmate Matching Detail */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              Best Room Sharing & Flatmate Experience for Working Professionals in Ambawadi
            </h2>
            <p className="text-center text-gray-600 mb-10">
              Finding the right flatmate in Ambawadi shouldn&apos;t be a gamble. Our smart matching system ensures you share your space with like-minded working professionals.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-3 text-emerald-700">Smart Flatmate Matching for a Peaceful Stay</h3>
                <p className="text-sm text-gray-600">
                  We consider your work schedule, lifestyle habits, and preferences to match you with compatible flatmates. No more awkward mismatches.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-3 text-emerald-700">Private & Shared Options</h3>
                <p className="text-sm text-gray-600">
                  Choose from single occupancy for complete privacy or 2-sharing to 10-sharing rooms with matched flatmates. All rooms are fully furnished and air-conditioned.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-3 text-emerald-700">Professional Community</h3>
                <p className="text-sm text-gray-600">
                  Join a community of working professionals from IT, finance, healthcare, and startups. Network, collaborate, or simply enjoy a quiet, respectful environment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Rooms Section */}
        <section aria-label="Featured Rooms" className="py-24 bg-white dark:bg-[#171A1C]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">Curated Stays</h2>
              <h3 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                Premium Room Selection
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {rooms.length > 0 ? (
                rooms.map((room) => {
                  const availableBeds = room.beds.filter((b) => b.status === "Available").length;
                  const minRent = room.beds.length > 0 ? Math.min(...room.beds.map((b) => Number(b.rent))) : null;
                  const imageSrc = room.coverImage || room.images?.[0] || "/images/room1.png";

                  return (
                    <Link
                      key={room.id}
                      href={`/rooms/${room.id}`}
                      className="group bg-white dark:bg-[#2D3235] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden transition-all hover:shadow-2xl block"
                    >
                      <div className="relative h-72 overflow-hidden">
                        <Image
                          fill
                          src={imageSrc}
                          alt={`Room ${room.name} at ${siteConfig.name}`}
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-full">
                            {room.sharingType}
                          </Badge>
                          <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-3 py-1 rounded-full">
                            {room.acType}
                          </Badge>
                        </div>
                        {availableBeds > 0 && (
                          <div className="absolute bottom-4 left-4">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                              {availableBeds} BED{availableBeds > 1 ? "S" : ""} LEFT
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{room.name}</h4>
                          <div className="flex items-center text-slate-400 text-sm">
                            <MapPin className="w-4 h-4 mr-1 text-emerald-500" />
                            {room.floor.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-8">
                          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                            <Wifi className="w-4 h-4" /> WiFi
                          </div>
                          {room.mealsIncluded && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                              <Coffee className="w-4 h-4" /> Meals
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                            <Shield className="w-4 h-4" /> Security
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Starting from</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {minRent !== null ? formatCurrency(minRent) : "Request"}<span className="text-sm font-normal text-slate-500">/mo</span>
                            </p>
                          </div>
                          <div className="bg-[#1F2937] dark:bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-6 flex items-center gap-1 group/btn transition-colors">
                            Details <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                // Fallback cards if no data
                [1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] h-[500px]" />
                ))
              )}
            </div>

            <div className="mt-16 text-center">
              <Button
                asChild
                variant="link"
                className="text-emerald-600 font-bold text-lg group"
              >
                <Link href="/rooms">
                  View all accommodation options <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section B: Location Advantage */}
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              5 Minutes Walk to Shreyas Metro Station & Parimal Garden
            </h2>
            <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
              Located in the heart of Ambawadi, The Waghad Villa offers working professionals unmatched connectivity and convenience.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">5 min</div>
                <div className="text-sm text-gray-600">Shreyas Metro</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">3 min</div>
                <div className="text-sm text-gray-600">Parimal Garden</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">7 min</div>
                <div className="text-sm text-gray-600">CG Road Offices</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">12 min</div>
                <div className="text-sm text-gray-600">SG Highway</div>
              </div>
            </div>

            <div className="mt-10 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
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
              <div className="p-4 sm:p-5 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <div className="text-center sm:text-left">
                  <h4 className="font-semibold text-slate-900">The Waghad Villa</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Near Parimal Garden, Ambawadi, Ahmedabad</p>
                </div>
                <a 
                  href="https://share.google/1pDMwRjDcqMAllWwG" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm"
                >
                  <MapPin className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialCarousel />

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[3rem] bg-[#1F2937] overflow-hidden py-20 px-10 text-center">
              {/* Abstract Background */}
              <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-emerald-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-emerald-800 rounded-full blur-[120px]" />
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-4xl sm:text-5xl font-bold text-white mb-8">
                  Ready to Experience <br /><span className="text-emerald-400">The Waghad Villa?</span>
                </h3>
                <p className="text-slate-300 text-lg mb-12">
                  Join our community today. Book a visit to see our rooms and experience our premium amenities first-hand.
                </p>
                <div className="flex flex-col items-center gap-6">
                  <Button
                    asChild
                    size="lg"
                    className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all hover:scale-105"
                  >
                    <Link href="/contact">Book Your Visit Now</Link>
                  </Button>
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium">Free site visits every day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <WhyChooseCompact />

        {/* FAQ Section */}
        <section aria-label="FAQ" className="py-24 bg-white dark:bg-[#171A1C]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">Support</h2>
              <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Frequently Asked Questions
              </h3>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  q: "What is flatmate matching at The Waghad Villa?",
                  a: "Our flatmate matching system pairs you with compatible roommates based on your work schedule, lifestyle preferences, and habits. This ensures a peaceful, drama-free living environment for all working professionals."
                },
                {
                  q: "Is this PG suitable for working professionals in Ambawadi?",
                  a: "Yes, The Waghad Villa is specifically designed for working professionals. We offer all-inclusive amenities, high-speed WiFi, quiet hours, and a location just 5 minutes from Shreyas Metro Station and major office hubs on CG Road."
                },
                {
                  q: "What does all-inclusive rent cover?",
                  a: "Our all-inclusive rent covers electricity, water, high-speed WiFi, maintenance, housekeeping, and laundry. You pay one fixed amount per month with no surprise bills or hidden charges."
                },
                {
                  q: "How flexible is the leaving policy?",
                  a: "We understand that job changes and transfers happen. Our flexible leaving policy requires only a reasonable notice period. We process deposit refunds within 15 days of move-out after a quick room inspection."
                },
                {
                  q: "How far is The Waghad Villa from Shreyas Metro Station?",
                  a: "The Waghad Villa is a 5-minute walk from Shreyas Metro Station on the Ahmedabad Metro line. Parimal Garden is just 3 minutes away, and CG Road commercial area is 7 minutes away."
                },
                {
                  q: "Do you offer single room or only room sharing?",
                  a: "We offer both options. You can choose a private single room for complete privacy, or opt for 2-sharing to 10-sharing rooms with professionally matched flatmates. All rooms are fully furnished and air-conditioned."
                },
                {
                  q: "What is the rent for room sharing in Ambawadi?",
                  a: "Room sharing at The Waghad Villa starts from ₹6,500 per month depending on sharing type (1-sharing to 10-sharing). All prices are inclusive of electricity, water, WiFi, and maintenance."
                },
                {
                  q: "Is the PG near Parimal Garden and CG Road?",
                  a: "Yes, The Waghad Villa is located in Ambawadi, just 3 minutes from Parimal Garden and 7 minutes from CG Road — Ahmedabad's main commercial and business district. This makes it ideal for working professionals."
                },
                {
                  q: "Can I get a rent receipt for my company reimbursement?",
                  a: "Absolutely. We provide digital rent receipts and payment confirmations for every transaction. You can download them from your guest dashboard and submit them for HRA reimbursement at your company."
                },
                {
                  q: "How do I book a room or schedule a visit?",
                  a: "You can book a free visit through our website by clicking the Book Visit button, or call us directly. We offer both in-person and virtual tours. Once you choose your room, our digital onboarding process gets you moved in within 24 hours."
                },
              ].map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#2D3235] px-8 transition-all data-[state=open]:bg-white dark:data-[state=open]:bg-navy-700 data-[state=open]:shadow-xl"
                >
                  <AccordionTrigger className="text-lg font-bold text-slate-900 dark:text-white hover:no-underline py-6">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-500 dark:text-slate-400 text-base leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <StickyBookCTA />

        {/* Natural Footer Sentence */}
        <section className="py-12 border-t border-slate-100 dark:border-slate-800">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              The Waghad Villa offers premium room sharing with smart flatmate matching in Ambawadi, Ahmedabad — designed for working professionals who value privacy, convenience, and a peaceful living environment.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
