"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Phone, Sparkles, X, Home, BedDouble, Image as ImageIcon, Info, Mail, LogIn, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rooms", label: "Rooms", icon: BedDouble },
  { href: "/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Navbar({ logoUrl }: { logoUrl?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            {logoUrl ? (
              <div className="relative h-9 w-28">
                <Image fill src={logoUrl} alt="The Waghad Villa" className="object-contain" />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              The Waghad Villa
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-semibold transition-all hover:text-emerald-600 relative group",
                  pathname === link.href ? "text-emerald-600" : "text-slate-600"
                )}
              >
                {link.label}
                <span className={cn(
                  "absolute -bottom-1 left-0 h-0.5 bg-emerald-500 transition-all",
                  pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </Link>
            ))}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/guest/login"
              className="px-3 py-2 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              Guest Login
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Book Visit
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0 bg-white border-l border-slate-100">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

              {/* Mobile drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <div className="relative h-8 w-24">
                      <Image fill src={logoUrl} alt="The Waghad Villa" className="object-contain" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-slate-900 whitespace-nowrap">The Waghad Villa</span>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col py-3 px-3">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all",
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", active ? "text-emerald-600" : "text-slate-400")} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom CTA */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 space-y-2 bg-white">
                <Link
                  href="/guest/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Guest Login
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  <CalendarCheck className="w-4 h-4" /> Book Free Visit
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
