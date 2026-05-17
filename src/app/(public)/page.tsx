import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-safe";
import { getCmsSettings } from "@/lib/cms";
import { generateSEO } from "@/lib/seo";
import Script from "next/script";

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
  Wind,
  WashingMachine,
  Droplets,
  Flame,
  ShieldCheck,
  UtensilsCrossed,
  Sparkles,
  Star,
  MapPin,
  ArrowRight,
  Clock,
  Shield,
  Coffee,
  ChevronRight,
  Quote,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const amenities = [
  { icon: Wifi, label: "High-Speed WiFi", description: "Seamless connectivity for work and study." },
  { icon: Wind, label: "Air Conditioning", description: "Climate-controlled rooms for ultimate comfort." },
  { icon: UtensilsCrossed, label: "Homely Meals", description: "Nutritious and delicious home-cooked food." },
  { icon: ShieldCheck, label: "24/7 Security", description: "CCTV surveillance and secure access." },
  { icon: WashingMachine, label: "Laundry", description: "Convenient laundry services on-site." },
  { icon: Droplets, label: "RO Water", description: "Pure and safe drinking water for all." },
  { icon: Flame, label: "Hot Water", description: "24/7 hot water supply in all bathrooms." },
  { icon: Sparkles, label: "Housekeeping", description: "Regular cleaning for a hygienic stay." },
];

const landmarks = [
  { name: "Vijay Cross Road", distance: "1.2 km", time: "5 mins" },
  { name: "Law Garden", distance: "1.5 km", time: "7 mins" },
  { name: "CG Road", distance: "2.0 km", time: "10 mins" },
  { name: "Gujarat University", distance: "3.5 km", time: "15 mins" },
  { name: "Shreyas Metro Station", distance: "400 m", time: "5 min walk" },
  { name: "Ellisbridge", distance: "1.8 km", time: "8 mins" },
];

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Software Engineer",
    rating: 5,
    quote: "The Waghad Villa is hands down the best PG in Ambawadi. Clean rooms, great food, and amazing management. Highly recommended!",
  },
  {
    name: "Vivek Joshi",
    role: "Business Analyst",
    rating: 5,
    quote: "Moved here 6 months ago and the experience has been fantastic. Professional crowd, disciplined environment, and the food quality is top-notch.",
  },
  {
    name: "Amit Desai",
    role: "Marketing Professional",
    rating: 4,
    quote: "Great value for money. AC rooms, homely meals, and just 5 minutes from Law Garden. Couldn't ask for more.",
  },
  {
    name: "Karan Mehta",
    role: "Chartered Accountant",
    rating: 5,
    quote: "Perfect for working professionals. Quiet atmosphere, fast WiFi, and the metro connectivity via Shreyas Metro is a huge plus.",
  },
  {
    name: "Siddharth Rao",
    role: "Product Manager",
    rating: 5,
    quote: "After staying at 3 different PGs in Ahmedabad, I finally found The Waghad Villa. The cleanliness and professional management stand out.",
  },
  {
    name: "Harsh Patel",
    role: "Data Analyst",
    rating: 4,
    quote: "Solid PG for young professionals. Good security, timely meals, and transparent billing. The deposit refund process was smooth too.",
  },
  {
    name: "Rohan Iyer",
    role: "UX Designer",
    rating: 5,
    quote: "Love the community here. Everyone is a working professional so it's peaceful during work hours. Weekend gatherings are fun too!",
  },
  {
    name: "Neeraj Gupta",
    role: "Consultant",
    rating: 5,
    quote: "The best part is the location — Shreyas Metro is a 5-minute walk, and CG Road is close by. Rooms are well-maintained and spacious.",
  },
];

const stats = [
  { label: "Happy Residents", value: "150+" },
  { label: "Verified Rooms", value: "25+" },
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

export const metadata = generateSEO({
  title: "Premium PG in Ambawadi Ahmedabad",
  description:
    "Fully furnished AC rooms with WiFi, homely meals, and 24/7 security. Best PG for students & professionals near Vijay Cross Road.",
  path: "/",
});

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
  const heroTagline = cms["cms_hero_tagline"] || "âœ¨ Premium Living Experience in Ahmedabad";
  const heroSubtitle = cms["cms_hero_subtitle"] || "Experience the perfect blend of comfort and community at The Waghad Villa. Premium AC rooms, high-speed WiFi, and homely meals in the heart of Ambawadi.";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "The Waghad Villa",
    description:
      "Premium PG in Ambawadi Ahmedabad for Students & Working Professionals",
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ambawadi",
      addressLocality: "Ahmedabad",
      addressRegion: "Gujarat",
      postalCode: "380006",
      addressCountry: "IN",
    },
    priceRange: "Rs.6500 - Rs.18000",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "WiFi" },
      { "@type": "LocationFeatureSpecification", name: "Air Conditioning" },
      { "@type": "LocationFeatureSpecification", name: "Meals" },
      { "@type": "LocationFeatureSpecification", name: "Laundry" },
    ],
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col min-h-screen bg-slate-50/30">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="The Waghad Villa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1F2937]/90 via-[#1F2937]/60 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl animate-reveal">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium">
              {heroTagline}
            </Badge>
            <Badge className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium">
              For Working Professionals
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Luxury Living <br />
              <span className="text-emerald-400">Simplified.</span>
            </h1>
            <p className="mt-8 text-xl text-slate-200 leading-relaxed max-w-2xl font-light">
              {heroSubtitle}
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-5">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 group"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  Book a Visit <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 rounded-2xl border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-all"
              >
                <Link href="/rooms">Explore Rooms</Link>
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span className="text-3xl font-bold text-emerald-400">{stat.value}</span>
                  <span className="text-sm text-slate-400 uppercase tracking-widest">{stat.label}</span>
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
      </section>

      {/* Amenities Section - Bento Grid Style */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">Our Features</h2>
              <h3 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                Crafted for Your <span className="text-emerald-600">Lifestyle.</span>
              </h3>
            </div>
            <p className="text-slate-500 max-w-md text-lg">
              We provide more than just a room. We provide a space where you can thrive, work, and relax.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {amenities.map(({ icon: Icon, label, description }) => (
              <div
                key={label}
                className="group relative bg-white dark:bg-[#2D3235] p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon className="w-24 h-24" />
                </div>
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{label}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-24 bg-white dark:bg-[#171A1C]">
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
                      <img
                        src={imageSrc}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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

      {/* Location & Map Section */}
      <section className="py-24 bg-slate-50 dark:bg-[#2D3235]/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">Location</h2>
              <h3 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">
                In the Heart of <br /><span className="text-emerald-600">Ambawadi.</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-12 leading-relaxed">
                Our strategic location ensures you are never far from major landmarks, 
                educational institutions, and corporate hubs in Ahmedabad.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {landmarks.map((l) => (
                  <div key={l.name} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#2D3235] shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{l.name}</p>
                      <p className="text-xs text-slate-500">{l.distance} â€¢ {l.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-[#2D3235] shadow-brand-900/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.936545199616!2d72.54581177607736!3d23.02604811613049!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84f676451e5d%3A0xe54e339b1393690d!2sAmbawadi%2C%20Ahmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale dark:invert contrast-125"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white dark:bg-[#171A1C] overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">Testimonials</h2>
            <h3 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Loved by our Residents
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="relative p-10 rounded-[2.5rem] bg-slate-50 dark:bg-[#2D3235] border border-slate-100 dark:border-slate-700 flex flex-col transition-all hover:bg-white dark:hover:bg-navy-700 hover:shadow-xl hover:border-brand-500/20"
              >
                <div className="absolute top-8 right-8 text-emerald-500/10">
                  <Quote className="w-16 h-16 fill-current" />
                </div>
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < t.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-8 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-auto flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
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

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-[#171A1C]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">Support</h2>
            <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Common Questions
            </h3>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                q: "What is the security deposit?",
                a: "The security deposit is equivalent to one month's rent and is fully refundable at the time of checkout, subject to notice period compliance."
              },
              {
                q: "Are homely meals included?",
                a: "Yes! Homely meals (Breakfast, Lunch, Dinner) are available and prepared in our hygienic central kitchen."
              },
              {
                q: "Is there a notice period?",
                a: "Yes, we require a 30-day notice period before vacating the room to ensure a smooth checkout process and full refund of deposit."
              },
              {
                q: "What documents are required?",
                a: "You'll need a valid Aadhaar Card, Student/Employee ID, and a passport-size photograph for registration."
              }
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

      {/* SEO Keywords Footer Section */}
      <section className="py-12 border-t border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            {siteConfig.keywords.map((k) => (
              <Badge key={k} variant="outline" className="rounded-full border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-light">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      </section>
    </div>
  </>);
}


