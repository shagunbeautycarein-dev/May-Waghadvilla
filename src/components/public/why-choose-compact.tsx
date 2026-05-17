import { siteConfig } from "@/config/site";

const features = [
  { icon: "💰", title: "Transparent Rent", desc: "Digital ledger, zero hidden charges" },
  { icon: "❄️", title: "AC All Rooms", desc: "Fully air-conditioned comfort" },
  { icon: "🍽️", title: "Homely Meals", desc: "Breakfast, lunch & dinner included" },
  { icon: "📶", title: "High-Speed WiFi", desc: "Unlimited broadband for work/study" },
  { icon: "🔒", title: "24/7 Security", desc: "CCTV + security guard" },
  { icon: "🧺", title: "Free Laundry", desc: "Weekly washing & ironing" },
  { icon: "⚡", title: "Fair Electricity", desc: "Per-bed billing, no equal split" },
  { icon: "📱", title: "App Tracking", desc: "Complaints & payments via app" },
];

export function WhyChooseCompact() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Why Choose {siteConfig.name}?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="p-4 rounded-xl border bg-gray-50 hover:bg-emerald-50 transition-colors">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
