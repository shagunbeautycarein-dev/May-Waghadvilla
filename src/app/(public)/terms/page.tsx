import { siteConfig } from "@/config/site";

export const metadata = {
  title: `Terms of Service | ${siteConfig.name}`,
  description: "Terms and conditions for residents of The Waghad Villa.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-sm max-w-none">
        <p className="text-gray-600 mb-4">Last updated: May 2026</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Accommodation Terms</h2>
        <p>By accepting accommodation at {siteConfig.name}, you agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Pay rent by the 5th of every month</li>
          <li>Provide 30 days written notice before vacating</li>
          <li>Maintain cleanliness and follow house rules</li>
          <li>Not sublet or transfer accommodation without written consent</li>
          <li>Allow management entry for inspection with 24-hour notice</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Rent & Payments</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Rent is payable monthly in advance</li>
          <li>Late payment fee: ₹500 after 5-day grace period</li>
          <li>Security deposit: 1 month rent (refundable after deductions)</li>
          <li>Electricity charges are billed separately based on actual usage per bed</li>
          <li>All payments to be made via UPI, cash, or bank transfer with proof upload</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Security Deposit</h2>
        <p>Security deposit will be refunded within 15 days of vacating, subject to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Deduction for damages beyond normal wear and tear</li>
          <li>Deduction for pending rent or electricity dues</li>
          <li>Deduction for lost keys or access cards</li>
          <li>Room must be returned in clean condition</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Prohibited Activities</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>No illegal activities on premises</li>
          <li>No smoking inside rooms (designated area available)</li>
          <li>No alcohol consumption in common areas</li>
          <li>No overnight guests without prior permission</li>
          <li>No pets allowed</li>
          <li>No cooking in rooms (common kitchen available)</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Termination</h2>
        <p>Management reserves the right to terminate accommodation with 7 days notice for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Violation of house rules</li>
          <li>Non-payment of rent for 15+ days</li>
          <li>Illegal activities</li>
          <li>Disturbance to other residents</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Liability</h2>
        <p>Management is not liable for loss of personal belongings. Residents are advised to secure valuables. Basic insurance for common areas is maintained.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Governing Law</h2>
        <p>These terms are governed by the laws of India and the state of Gujarat. Disputes shall be subject to Ahmedabad jurisdiction.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">8. Contact</h2>
        <p>For queries: {siteConfig.contact.email} | {siteConfig.contact.phone}</p>
      </div>
    </div>
  );
}
