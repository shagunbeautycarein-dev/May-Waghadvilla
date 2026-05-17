"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, MapPin, Wifi, User, Briefcase, FileText, Lock } from "lucide-react";
import { getGuestSession } from "@/lib/supabase/auth";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/formatters";

interface OnboardingDocs {
  aadhar?: string;
  pan?: string;
  photo?: string;
  idFrontUrl?: string;
  idType?: string;
}

interface OnboardingData {
  step1Personal?: {
    fullName?: string;
    mobile?: string;
    email?: string;
    dob?: string;
    bloodGroup?: string;
    address?: string;
    city?: string;
  };
  step4Documents?: OnboardingDocs;
}

interface Guest {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  status?: string;
  deposit?: number | string;
  monthlyRent?: number | string;
  joiningDate?: string;
  room?: { name: string; wifiPassword?: string };
  bed?: { name: string };
  onboardingData?: OnboardingData;
}

export default function GuestProfilePage() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWifi, setShowWifi] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  useEffect(() => {
    async function load() {
      try {
        // Try Supabase auth first
        const { data: sessionData } = await getGuestSession();
        const email = sessionData.session?.user?.email;
        if (email) {
          const res = await fetch(`/api/guest/profile?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            setGuest(await res.json());
            return;
          }
        }

        // Fallback: custom guest_session cookie
        const res = await fetch("/api/guest/me");
        if (res.ok) {
          setGuest(await res.json());
          return;
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPass !== passwordData.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    toast.info("Password change not implemented yet");
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-xl border border-slate-100 animate-pulse" />
          <div className="h-80 bg-white rounded-xl border border-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Profile not found.</p>
      </div>
    );
  }

  const personal = guest.onboardingData?.step1Personal || {};
  const docs = guest.onboardingData?.step4Documents || {};

  const infoRows = [
    { label: "Name", value: personal.fullName || guest.name },
    { label: "Mobile", value: personal.mobile || guest.mobile || "-" },
    { label: "Email", value: personal.email || guest.email || "-" },
    { label: "Date of Birth", value: personal.dob ? formatDate(personal.dob) : "-" },
    { label: "Blood Group", value: personal.bloodGroup || "-" },
    { label: "Address", value: `${personal.address || "-"}, ${personal.city || "-"}` },
  ];

  const roomRows = [
    { label: "Room", value: guest.room?.name || "-" },
    { label: "Bed", value: guest.bed?.name || "-" },
    {
      label: "Joining Date",
      value: guest.joiningDate ? formatDate(guest.joiningDate) : "-",
    },
    { label: "Monthly Rent", value: formatCurrency(guest.monthlyRent) },
    { label: "Deposit", value: formatCurrency(guest.deposit) },
  ];

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your personal and room information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-900">Personal Details</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-xs font-medium text-slate-500">{row.label}</span>
                <span className="text-sm text-slate-900 text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Room Info Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-900">Room Details</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {roomRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-xs font-medium text-slate-500">{row.label}</span>
                <span className="text-sm text-slate-900 text-right">{row.value}</span>
              </div>
            ))}
            {/* WiFi Password */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-xs font-medium text-slate-500">WiFi Password</span>
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-mono text-slate-900">
                  {showWifi ? guest.room?.wifiPassword || "Not set" : "••••••••"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-slate-100"
                  onClick={() => setShowWifi(!showWifi)}
                >
                  {showWifi ? (
                    <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Documents Section */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-slate-900">KYC Documents</h2>
        </div>
        <div className="p-5">
          {docs.aadhar || docs.pan || docs.photo || docs.idFrontUrl ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {docs.aadhar && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Aadhar Card</p>
                  <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                    <img src={docs.aadhar} alt="Aadhar" className="w-full h-32 object-contain" />
                  </div>
                </div>
              )}
              {docs.pan && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">PAN Card</p>
                  <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                    <img src={docs.pan} alt="PAN" className="w-full h-32 object-contain" />
                  </div>
                </div>
              )}
              {docs.photo && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Passport Photo</p>
                  <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                    <img src={docs.photo} alt="Photo" className="w-full h-32 object-contain" />
                  </div>
                </div>
              )}
              {/* Backward compatibility for old uploads */}
              {docs.idFrontUrl && !docs.aadhar && !docs.pan && !docs.photo && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    ID ({docs.idType || "Document"})
                  </p>
                  <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                    <img src={docs.idFrontUrl} alt="ID" className="w-full h-32 object-contain" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No documents uploaded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-900">Security</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? "Cancel" : "Change Password"}
          </Button>
        </div>
        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="p-5 space-y-4 max-w-md">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Current Password</Label>
              <Input
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">New Password</Label>
              <Input
                type="password"
                value={passwordData.newPass}
                onChange={(e) => setPasswordData({ ...passwordData, newPass: e.target.value })}
                className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Confirm New Password</Label>
              <Input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
              />
            </div>
            <Button
              type="submit"
              className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
