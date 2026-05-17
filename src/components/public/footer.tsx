import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getCmsSettings } from "@/lib/cms";
import { Phone, Mail, MapPin, Sparkles, Facebook, Instagram, Twitter, Linkedin, MessageCircle } from "lucide-react";

export async function Footer() {
  const cms = await getCmsSettings();

  const phone = cms["cms_contact_phone"] || siteConfig.contact.phone;
  const email = cms["cms_contact_email"] || siteConfig.contact.email;
  const address = cms["cms_contact_address"] || siteConfig.contact.address;
  const whatsapp = cms["cms_contact_whatsapp"] || siteConfig.contact.whatsapp;

  const facebook = cms["cms_social_facebook"] || siteConfig.social.facebook || "";
  const instagram = cms["cms_social_instagram"] || siteConfig.social.instagram || "";
  const twitter = cms["cms_social_twitter"] || "";
  const linkedin = cms["cms_social_linkedin"] || "";

  const socials = [
    { href: facebook, icon: Facebook, label: "Facebook" },
    { href: instagram, icon: Instagram, label: "Instagram" },
    { href: twitter, icon: Twitter, label: "Twitter" },
    { href: linkedin, icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => s.href && s.href.trim());

  return (
    <footer className="bg-[#1F2937] text-white pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">The Waghad Villa</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Premium PG accommodation in Ambawadi, Ahmedabad. We provide a safe,
              clean, and community-focused environment for students and professionals.
            </p>
            {socials.length > 0 && (
              <div className="flex gap-3">
                {socials.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="flex flex-col gap-4 text-slate-400 text-sm">
              <li><Link href="/rooms" className="hover:text-emerald-400 transition-colors">Find a Room</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">Our Story</Link></li>
              <li><Link href="/gallery" className="hover:text-emerald-400 transition-colors">Gallery</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Contact Info</h4>
            <ul className="flex flex-col gap-4 text-slate-400 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-500" />
                {phone}
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-500" />
                {email}
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-emerald-500" />
                {address}
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                  {whatsapp}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Newsletter</h4>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Stay updated with our latest offers and availability.
            </p>
            {/* Newsletter input placeholder */}
            <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-slate-500 text-xs">
              Enter your email...
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-xs">
            Â© {new Date().getFullYear()} The Waghad Villa. All rights reserved.
          </p>
          <div className="flex gap-8 text-slate-500 text-xs uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
