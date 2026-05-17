import { siteConfig } from "@/config/site";

export const metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: "Privacy policy for The Waghad Villa PG residents and visitors.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-sm max-w-none">
        <p className="text-gray-600 mb-4">Last updated: May 2026</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
        <p>We collect personal information including name, mobile number, email address, date of birth, blood group, permanent address, emergency contact details, employment information, and government ID documents (Aadhaar/PAN) for verification purposes.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
        <p>Your information is used solely for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>PG accommodation registration and management</li>
          <li>Rent and utility billing</li>
          <li>Emergency contact purposes</li>
          <li>Legal compliance and police verification as required by Indian law</li>
          <li>Internal record keeping</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Data Storage & Security</h2>
        <p>All data is stored on secure servers within India. We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, or destruction.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Sharing</h2>
        <p>We do not sell or rent your personal information. We may share data with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Law enforcement agencies when legally required</li>
          <li>Local authorities for police verification (mandatory as per Gujarat Police regulations)</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Your Rights</h2>
        <p>Under the Digital Personal Data Protection Act 2023, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of data after vacating (subject to legal retention requirements)</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Document Retention</h2>
        <p>As per Indian law and local police requirements, resident documents are retained for 1 year after vacating. Financial records are retained for 7 years as per Income Tax Act requirements.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Contact</h2>
        <p>For privacy-related queries, contact: {siteConfig.contact.email}</p>
      </div>
    </div>
  );
}
