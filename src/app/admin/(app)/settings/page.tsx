"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Plus, Trash2, Users, Percent, Bell, ShieldAlert, Settings2, User, CreditCard, QrCode, Upload } from "lucide-react";
import { SystemResetPanel } from "@/components/admin/system-reset-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const SETTING_KEYS = [
  {
    category: "Onboarding",
    keys: [
      { key: "rent_cycle_date", label: "Rent Cycle Date", type: "number" as const, description: "Day of the month when rent is due" },
      { key: "advance_rent_count", label: "Advance Rent Count", type: "number" as const, description: "Number of months rent to collect in advance" },
      { key: "deposit_rule", label: "Deposit Rule", type: "text" as const, description: "e.g. 1 Month Rent" },
    ],
  },
  {
    category: "Leaving",
    keys: [
      { key: "notice_period_days", label: "Notice Period (Days)", type: "number" as const, description: "Days of notice required before leaving" },
    ],
  },
  {
    category: "Payment",
    keys: [
      { key: "grace_days", label: "Grace Period (Days)", type: "number" as const, description: "Grace days before late fee applies" },
      { key: "late_fee", label: "Late Fee (₹)", type: "number" as const, description: "Late fee amount in rupees" },
    ],
  },
  {
    category: "Policies",
    keys: [
      { key: "house_rules", label: "House Rules", type: "textarea" as const, description: "Rules displayed to guests during onboarding" },
      { key: "terms_and_conditions", label: "Terms & Conditions", type: "textarea" as const, description: "Terms displayed to guests during onboarding" },
      { key: "leaving_policy", label: "Leaving Policy", type: "textarea" as const, description: "Leaving policy displayed to guests during onboarding" },
    ],
  },
];

const GST_KEYS = [
  { key: "gst_enabled", label: "Enable GST", type: "toggle" as const },
  { key: "gst_percentage", label: "GST Percentage", type: "number" as const, description: "e.g. 18" },
];

const NOTIFICATION_KEYS = [
  { key: "email_notifications", label: "Email Notifications", type: "toggle" as const },
  { key: "reminder_notifications", label: "Reminder Notifications", type: "toggle" as const },
];

type StaffMember = {
  id: string;
  name: string;
  mobile: string | null;
  role: string;
};

type SettingsState = Record<string, string>;

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("profile");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const checkAdmin = async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        setIsSuperAdmin(data.role === "Super Admin");
        setAdmin(data);
      }
    } catch {
      // ignore
    }
  };

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", mobile: "", role: "" });
  const [staffSaving, setStaffSaving] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const allKeys = [
      ...SETTING_KEYS.flatMap((g) => g.keys.map((k) => k.key)),
      ...GST_KEYS.map((k) => k.key),
      ...NOTIFICATION_KEYS.map((k) => k.key),
      "admin_whatsapp",
    "payment_upi_id",
    "payment_qr_code",
    ];
    const results: SettingsState = {};

    await Promise.all(
      allKeys.map(async (key) => {
        try {
          const res = await fetch(`/api/settings/${key}`);
          if (res.ok) {
            const data = await res.json();
            results[key] = data.value || "";
          }
        } catch {
          // ignore
        }
      })
    );

    setSettings(results);
    setLoading(false);
  }, []);

  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) setStaff(await res.json());
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchStaff();
    checkAdmin();
  }, [fetchSettings, fetchStaff]);

  const updateSetting = async (key: string, value: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Setting saved");
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch {
      toast.error("Failed to save setting");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    const newValue = settings[key] === "true" ? "false" : "true";
    updateSetting(key, newValue);
  };

  const handleUpdateProfile = async () => {
    if (!admin) return;
    if (!admin.name || !admin.email) {
      toast.error("Name and email are required");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: admin.name, email: admin.email }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }
      toast.success("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAddStaff = async () => {
    if (!staffForm.name || !staffForm.role) {
      toast.error("Name and role are required");
      return;
    }
    setStaffSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Staff added");
      setShowStaffForm(false);
      setStaffForm({ name: "", mobile: "", role: "" });
      fetchStaff();
    } catch {
      toast.error("Failed to add staff");
    } finally {
      setStaffSaving(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Staff removed");
      fetchStaff();
    } catch {
      toast.error("Failed to remove staff");
    }
  };

  const SettingField = ({ setting }: { setting: { key: string; label: string; type: string; description?: string } }) => {
    if (setting.type === "toggle") {
      const isOn = settings[setting.key] === "true";
      return (
        <div className="flex items-center justify-between py-2">
          <Label className="text-sm font-medium text-slate-700">{setting.label}</Label>
          <button
            onClick={() => handleToggle(setting.key)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              isOn ? "bg-teal-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                isOn ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">{setting.label}</Label>
          <Button
            size="sm"
            onClick={() => updateSetting(setting.key, settings[setting.key] || "")}
            disabled={saving[setting.key]}
            className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-8 px-4"
          >
            {saving[setting.key] ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save
          </Button>
        </div>
        {setting.type === "textarea" ? (
          <Textarea
            value={settings[setting.key] || ""}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.description}
            rows={6}
            className="rounded-xl border-slate-200 resize-none"
          />
        ) : (
          <Input
            type={setting.type === "number" ? "number" : "text"}
            value={settings[setting.key] || ""}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.description}
            className="rounded-xl border-slate-200"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage property policies and rules</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "general", label: "General", icon: Settings2 },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "gst", label: "GST", icon: Percent },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "staff", label: "Staff", icon: Users },
    ...(isSuperAdmin ? [{ key: "system", label: "System", icon: ShieldAlert }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage property policies, taxes, and staff</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activeTab === tab.key
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "profile" && (
        <div className="grid gap-6 max-w-lg">
          <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">Admin Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Name</Label>
                <Input
                  value={admin?.name || ""}
                  onChange={(e) => setAdmin((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="Your name"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  type="email"
                  value={admin?.email || ""}
                  onChange={(e) => setAdmin((prev) => prev ? { ...prev, email: e.target.value } : prev)}
                  placeholder="admin@example.com"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <Button
                onClick={handleUpdateProfile}
                disabled={profileSaving}
                className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-9 px-4"
              >
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">WhatsApp Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">WhatsApp Number</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={settings["admin_whatsapp"] || ""}
                    onChange={(e) => handleChange("admin_whatsapp", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="rounded-xl border-slate-200"
                  />
                  <Button
                    size="sm"
                    onClick={() => updateSetting("admin_whatsapp", settings["admin_whatsapp"] || "")}
                    disabled={saving["admin_whatsapp"]}
                    className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-9 px-4"
                  >
                    {saving["admin_whatsapp"] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-9 px-4"
              >
                {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "payment" && (
        <div className="grid gap-6 max-w-lg">
          <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">UPI ID</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={settings["payment_upi_id"] || ""}
                    onChange={(e) => handleChange("payment_upi_id", e.target.value)}
                    placeholder="e.g. theWaghadvilla@upi"
                    className="rounded-xl border-slate-200"
                  />
                  <Button
                    size="sm"
                    onClick={() => updateSetting("payment_upi_id", settings["payment_upi_id"] || "")}
                    disabled={saving["payment_upi_id"]}
                    className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-9 px-4"
                  >
                    {saving["payment_upi_id"] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">QR Code Image</Label>
                {settings["payment_qr_code"] ? (
                  <div className="relative group w-fit">
                    <img
                      src={settings["payment_qr_code"]}
                      alt="Payment QR"
                      className="h-48 w-48 object-contain rounded-xl border border-slate-200 bg-white"
                    />
                    <button
                      onClick={() => updateSetting("payment_qr_code", "")}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove QR"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <QrCode className="h-8 w-8" />
                    <p className="text-xs">No QR code uploaded</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={qrInputRef}
                    hidden
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setQrUploading(true);
                      try {
                        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                        if (!cloudName) throw new Error("Cloudinary not configured");
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("upload_preset", "wahad_villa_unsigned");
                        formData.append("folder", "wahad-villa/payment");
                        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
                          method: "POST",
                          body: formData,
                        });
                        if (!res.ok) throw new Error("Upload failed");
                        const data = await res.json();
                        await updateSetting("payment_qr_code", data.secure_url);
                      } catch (err: any) {
                        toast.error(err.message || "QR upload failed");
                      } finally {
                        setQrUploading(false);
                        if (qrInputRef.current) qrInputRef.current.value = "";
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => qrInputRef.current?.click()}
                    disabled={qrUploading}
                    className="rounded-full border-slate-200"
                  >
                    {qrUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {qrUploading ? "Uploading" : settings["payment_qr_code"] ? "Change QR" : "Upload QR"}
                  </Button>
                  {settings["payment_qr_code"] && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateSetting("payment_qr_code", "")}
                      className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "general" && (
        <div className="grid gap-6">
          {SETTING_KEYS.map((group) => (
            <Card key={group.category} className="rounded-xl shadow-sm border-slate-100 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">{group.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {group.keys.map((setting) => (
                  <SettingField key={setting.key} setting={setting} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "gst" && (
        <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-slate-900">GST Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 max-w-lg">
            {GST_KEYS.map((setting) => (
              <SettingField key={setting.key} setting={setting} />
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "notifications" && (
        <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-slate-900">Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 max-w-lg">
            {NOTIFICATION_KEYS.map((setting) => (
              <SettingField key={setting.key} setting={setting} />
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Staff Members</h2>
            <Button
              onClick={() => setShowStaffForm(true)}
              className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-9 px-4"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Staff
            </Button>
          </div>

          {showStaffForm && (
            <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="Name"
                    className="rounded-xl border-slate-200"
                  />
                  <Input
                    value={staffForm.mobile}
                    onChange={(e) => setStaffForm({ ...staffForm, mobile: e.target.value })}
                    placeholder="Mobile"
                    className="rounded-xl border-slate-200"
                  />
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="">Select Role</option>
                    {["Cook", "Cleaner", "Maintenance", "Security", "Other"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowStaffForm(false)}
                    className="rounded-full border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddStaff}
                    disabled={staffSaving}
                    className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {staffSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {staffLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : staff.length === 0 ? (
              <EmptyState icon={Users} title="No staff members" subtitle="Add staff members to manage property operations." actionLabel="Add Staff Member" action={() => setShowStaffForm(true)} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Mobile</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.mobile || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700">
                          {s.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStaff(s.id)}
                          className="h-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {activeTab === "system" && <SystemResetPanel isSuperAdmin={isSuperAdmin} />}
    </div>
  );
}
