"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  UserCheck,
  XCircle,
  Calculator,
  Search,
  Filter,
  BedDouble,
  Home,
  User,
  CheckCircle2,
  MessageSquare,
  Eye,
  ChevronDown,
  Smartphone,
  Laptop,
  Copy,
  Check,
  Trash2,
  Key,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { calculateRentDifference, calculateTotalPayable } from "@/lib/rent-calculator";
import { OnboardingWizard } from "@/components/onboarding/wizard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { INQUIRY_STATUSES, INQUIRY_STATUS_COLORS } from "@/lib/constants";

type Inquiry = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  visitDate: string;
  timeSlot: string;
  status: string;
  roomId: string | null;
  bedId: string | null;
  joiningDate: string | null;
  monthlyRent: number | null;
  deposit: number | null;
  rentCycleDate: number | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  guestOnboardingStatus: string | null;
  guestHasPassword: boolean;
  guestId: string | null;
};

type Room = {
  id: string;
  name: string;
};

type Bed = {
  id: string;
  roomId: string;
  name: string;
  rent: number;
  deposit: number;
  status: string;
};

const TABS = ["All", ...INQUIRY_STATUSES];

const STATUS_META: Record<string, { icon: typeof User; color: string; bg: string; border: string }> = {
  "New Inquiry": { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  "Follow Up": { icon: Eye, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  "Visited": { icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
  "Confirmed": { icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Cancelled": { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [allBeds, setAllBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rentCycleDate, setRentCycleDate] = useState("");

  const [cancelReason, setCancelReason] = useState("");
  const [onboardingLink, setOnboardingLink] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeleteInquiry, setSelectedDeleteInquiry] = useState<Inquiry | null>(null);

  // Two-option convert flow
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [guestCredentials, setGuestCredentials] = useState<{ email: string; password: string } | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [isResumeMode, setIsResumeMode] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardToken, setWizardToken] = useState<string | null>(null);

  const fetchInquiries = async (status?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status && status !== "All") params.append("status", status);
      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      const data: Inquiry[] = await res.json();
      setInquiries(data);
    } catch {
      toast.error("Failed to fetch inquiries");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = (await res.json()) as Array<Room & Record<string, unknown>>;
      setRooms(data.map((r) => ({ id: r.id, name: r.name })));
    } catch {
      toast.error("Failed to fetch rooms");
    }
  };

  const fetchBeds = async (roomId: string) => {
    try {
      const res = await fetch(`/api/admin/beds?roomId=${roomId}&status=Available`);
      if (!res.ok) throw new Error("Failed to fetch beds");
      const data: Bed[] = await res.json();
      setBeds(data);
    } catch {
      toast.error("Failed to fetch beds");
    }
  };

  const fetchAllBeds = async () => {
    try {
      const res = await fetch("/api/admin/beds");
      if (!res.ok) throw new Error("Failed to fetch beds");
      const data: Bed[] = await res.json();
      setAllBeds(data);
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchInquiries(activeTab === "All" ? undefined : activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchRooms();
    fetchAllBeds();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      fetchBeds(selectedRoomId);
    } else {
      setBeds([]);
      setSelectedBedId("");
    }
  }, [selectedRoomId]);

  useEffect(() => {
    if (selectedBedId) {
      const bed = beds.find((b) => b.id === selectedBedId);
      if (bed) {
        setMonthlyRent(bed.rent.toString());
        setDeposit(bed.deposit.toString());
      }
    }
  }, [selectedBedId, beds]);

  const roomMap = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((r) => map.set(r.id, r.name));
    return map;
  }, [rooms]);

  const bedMap = useMemo(() => {
    const map = new Map<string, string>();
    allBeds.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [allBeds]);

  const stats = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === "New Inquiry").length;
    const followUp = inquiries.filter((i) => i.status === "Follow Up").length;
    const visited = inquiries.filter((i) => i.status === "Visited").length;
    const confirmed = inquiries.filter((i) => i.status === "Confirmed").length;
    const cancelled = inquiries.filter((i) => i.status === "Cancelled").length;
    return { total, newCount, followUp, visited, confirmed, cancelled };
  }, [inquiries]);

  const handleStatusChange = async (inquiry: Inquiry, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inquiry.id, status: newStatus }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error || "Failed to update status");
        return;
      }
      toast.success(`Marked as ${newStatus}`);
      fetchInquiries(activeTab === "All" ? undefined : activeTab);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const openConvertDialog = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setSelectedRoomId(inquiry.roomId || "");
    setSelectedBedId(inquiry.bedId || "");
    setJoiningDate(inquiry.joiningDate ? inquiry.joiningDate.split("T")[0] : "");
    setMonthlyRent(inquiry.monthlyRent?.toString() || "");
    setDeposit(inquiry.deposit?.toString() || "");
    setRentCycleDate(inquiry.rentCycleDate?.toString() || "");
    setConvertDialogOpen(true);
  };

  const openCancelDialog = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setCancelReason(inquiry.cancellationReason || "");
    setCancelDialogOpen(true);
  };

  const handleConvert = () => {
    if (!selectedInquiry) return;
    if (!selectedRoomId || !selectedBedId || !joiningDate || !monthlyRent || !deposit || !rentCycleDate) {
      toast.error("Please fill all required fields");
      return;
    }
    // Close convert form, open option chooser
    setConvertDialogOpen(false);
    setIsResumeMode(false);
    setOptionDialogOpen(true);
  };

  const resumeOnboarding = async (inquiry: Inquiry) => {
    if (!inquiry.guestId) {
      toast.error("Guest not found");
      return;
    }
    try {
      const res = await fetch(`/api/admin/onboarding-tokens?guestId=${inquiry.guestId}`);
      if (!res.ok) {
        toast.error("Failed to fetch onboarding link");
        return;
      }
      const { link } = await res.json();
      setOnboardingLink(link);
      setSelectedInquiry(inquiry);
      setIsResumeMode(true);
      setOptionDialogOpen(true);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const processResume = async (option: "guest" | "admin") => {
    if (!selectedInquiry || !selectedInquiry.guestId) return;
    setConvertLoading(true);

    try {
      if (option === "guest") {
        const res = await fetch("/api/admin/guests/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId: selectedInquiry.guestId }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to generate credentials");
          setConvertLoading(false);
          return;
        }
        const { credentials } = await res.json();
        setGuestCredentials(credentials);
        setOptionDialogOpen(false);
        setCredentialsDialogOpen(true);
        toast.success("Credentials generated. Share with the guest.");
      } else {
        // Admin completes
        setOptionDialogOpen(false);
        setLinkDialogOpen(true);
      }

      setSelectedInquiry(null);
      setIsResumeMode(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setConvertLoading(false);
    }
  };

  const resetAndReshare = async (inquiry: Inquiry) => {
    if (!inquiry.guestId || !inquiry.email) {
      toast.error("Guest information missing");
      return;
    }
    try {
      const res = await fetch("/api/admin/guests/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: inquiry.guestId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to reset password");
        return;
      }
      const { credentials } = await res.json();
      setGuestCredentials(credentials);
      setCredentialsDialogOpen(true);
      toast.success("New password generated");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const processConvert = async (option: "guest" | "admin") => {
    if (!selectedInquiry) return;
    setConvertLoading(true);

    try {
      // 1. Update inquiry status
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedInquiry.id,
          status: "Confirmed",
          roomId: selectedRoomId,
          bedId: selectedBedId,
          joiningDate,
          monthlyRent: Number(monthlyRent),
          deposit: Number(deposit),
          rentCycleDate: Number(rentCycleDate),
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error || "Failed to convert inquiry");
        setConvertLoading(false);
        return;
      }

      // 2. Reserve bed
      const bedRes = await fetch("/api/admin/beds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBedId,
          status: "Reserved",
        }),
      });
      if (!bedRes.ok) {
        const err = (await bedRes.json()) as { error?: string };
        toast.error(err.error || "Failed to reserve bed");
        setConvertLoading(false);
        return;
      }

      // 3. Create guest
      const guestRes = await fetch("/api/admin/guests/create-from-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedInquiry.name,
          mobile: selectedInquiry.mobile,
          email: selectedInquiry.email,
          roomId: selectedRoomId,
          bedId: selectedBedId,
          joiningDate,
          monthlyRent: Number(monthlyRent),
          deposit: Number(deposit),
          rentCycleDate: Number(rentCycleDate),
          generatePassword: option === "guest",
        }),
      });
      if (!guestRes.ok) {
        const err = (await guestRes.json()) as { error?: string };
        toast.error(err.error || "Failed to create guest");
        setConvertLoading(false);
        return;
      }
      const { guest, credentials } = await guestRes.json();

      // 4. Generate onboarding token
      const tokenRes = await fetch("/api/admin/onboarding-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      if (!tokenRes.ok) {
        toast.error("Failed to generate onboarding token");
        setConvertLoading(false);
        return;
      }
      const { link } = await tokenRes.json();
      setOnboardingLink(link);

      toast.success("Inquiry converted to guest successfully");
      setOptionDialogOpen(false);
      setSelectedInquiry(null);
      setSelectedRoomId("");
      setSelectedBedId("");
      setJoiningDate("");
      setMonthlyRent("");
      setDeposit("");
      setRentCycleDate("");
      fetchInquiries(activeTab === "All" ? undefined : activeTab);

      if (option === "guest" && credentials) {
        setGuestCredentials(credentials);
        setCredentialsDialogOpen(true);
      } else {
        setLinkDialogOpen(true);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setConvertLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedInquiry) return;
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedInquiry.id,
          status: "Cancelled",
          cancellationReason: cancelReason.trim(),
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error || "Failed to cancel inquiry");
        return;
      }
      toast.success("Inquiry cancelled");
      setCancelDialogOpen(false);
      setSelectedInquiry(null);
      setCancelReason("");
      fetchInquiries(activeTab === "All" ? undefined : activeTab);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!selectedDeleteInquiry) return;
    try {
      const res = await fetch(`/api/admin/inquiries?id=${selectedDeleteInquiry.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error || "Failed to delete inquiry");
        return;
      }
      toast.success("Inquiry deleted");
      setDeleteDialogOpen(false);
      setSelectedDeleteInquiry(null);
      fetchInquiries(activeTab === "All" ? undefined : activeTab);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const openDeleteDialog = (inquiry: Inquiry) => {
    setSelectedDeleteInquiry(inquiry);
    setDeleteDialogOpen(true);
  };

  const rentCalculation = useMemo(() => {
    if (!joiningDate || !monthlyRent || !rentCycleDate) return null;
    const rent = Number(monthlyRent);
    const dep = Number(deposit) || 0;
    const cycleDay = Number(rentCycleDate);
    if (!rent || !cycleDay) return null;

    try {
      const calc = calculateRentDifference(rent, new Date(joiningDate), cycleDay);
      const total = calculateTotalPayable(rent, dep, calc.differenceAmount);
      return { ...calc, total, rent: dep };
    } catch {
      return null;
    }
  }, [joiningDate, monthlyRent, deposit, rentCycleDate]);

  const filteredInquiries = useMemo(() => {
    let result = activeTab === "All" ? inquiries : inquiries.filter((i) => i.status === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.mobile.includes(q) ||
          (i.email && i.email.toLowerCase().includes(q))
      );
    }
    return result;
  }, [inquiries, activeTab, searchQuery]);

  const StatCard = ({
    label,
    value,
    color,
    active,
    onClick,
  }: {
    label: string;
    value: number;
    color: string;
    active?: boolean;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`text-left w-full rounded-xl border p-4 transition-all ${
        active
          ? "border-teal-200 bg-teal-50 shadow-sm"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiries</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track guest inquiries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="rounded-full"
          >
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="rounded-full"
          >
            Table
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          color="text-slate-700"
          active={activeTab === "All"}
          onClick={() => setActiveTab("All")}
        />
        <StatCard
          label="New"
          value={stats.newCount}
          color="text-blue-600"
          active={activeTab === "New Inquiry"}
          onClick={() => setActiveTab("New Inquiry")}
        />
        <StatCard
          label="Follow Up"
          value={stats.followUp}
          color="text-amber-600"
          active={activeTab === "Follow Up"}
          onClick={() => setActiveTab("Follow Up")}
        />
        <StatCard
          label="Visited"
          value={stats.visited}
          color="text-teal-600"
          active={activeTab === "Visited"}
          onClick={() => setActiveTab("Visited")}
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          color="text-emerald-600"
          active={activeTab === "Confirmed"}
          onClick={() => setActiveTab("Confirmed")}
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          color="text-red-600"
          active={activeTab === "Cancelled"}
          onClick={() => setActiveTab("Cancelled")}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, mobile, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl border-slate-200"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full text-xs ${
                activeTab === tab
                  ? "bg-teal-600 text-white hover:bg-teal-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-white p-5 space-y-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-slate-100 rounded" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-3/4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <DataTableSkeleton columns={6} />
        )
      ) : filteredInquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No inquiries found"
          subtitle={searchQuery ? "Try adjusting your search or filters." : "No inquiries in this category yet."}
        />
      ) : viewMode === "cards" ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredInquiries.map((inquiry) => {
            const meta = STATUS_META[inquiry.status] || STATUS_META["New Inquiry"];
            const StatusIcon = meta.icon;
            const isExpanded = expandedCard === inquiry.id;

            return (
              <div
                key={inquiry.id}
                className="rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${meta.bg} ${meta.color}`}>
                        {inquiry.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{inquiry.name}</h3>
                        <p className="text-xs text-slate-500">
                          {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          INQUIRY_STATUS_COLORS[inquiry.status] || "bg-slate-100 text-slate-800"
                        }`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {inquiry.status}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(inquiry)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete inquiry</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5">
                    <a
                      href={`tel:${inquiry.mobile}`}
                      className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {inquiry.mobile}
                    </a>
                    {inquiry.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {inquiry.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Visit Info */}
                <div className="px-5 py-3 bg-slate-50/50 border-y border-slate-50">
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(inquiry.visitDate)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {inquiry.timeSlot}
                    </div>
                  </div>
                  {inquiry.roomId && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Home className="h-3 w-3 text-slate-400" />
                        {roomMap.get(inquiry.roomId) || "—"}
                      </div>
                      {inquiry.bedId && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <BedDouble className="h-3 w-3 text-slate-400" />
                          Bed {bedMap.get(inquiry.bedId) || ""}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4">
                  {inquiry.status === "New Inquiry" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(inquiry, "Follow Up")}
                          className="w-full rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                          Mark as Follow Up
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Move to Follow Up</TooltipContent>
                    </Tooltip>
                  )}
                  {inquiry.status === "Follow Up" && (
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(inquiry, "Visited")}
                            className="flex-1 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Visited
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark as Visited</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCancelDialog(inquiry)}
                            className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cancel inquiry</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  {inquiry.status === "Visited" && (
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => openConvertDialog(inquiry)}
                          >
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                            Convert to Guest
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Convert to guest</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCancelDialog(inquiry)}
                            className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cancel inquiry</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  {inquiry.status === "Confirmed" && (
                    <>
                      {inquiry.guestOnboardingStatus === "Approved" || inquiry.guestOnboardingStatus === "Submitted" ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-full px-4 py-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">Converted to Guest</span>
                          </div>
                          {inquiry.guestHasPassword && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50"
                                  onClick={() => resetAndReshare(inquiry)}
                                >
                                  <Key className="mr-1.5 h-3.5 w-3.5" />
                                  Password
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Show / Reset password</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-full px-4 py-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Onboarding Pending</span>
                          </div>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                                  onClick={() => resumeOnboarding(inquiry)}
                                >
                                  <Laptop className="mr-1.5 h-3.5 w-3.5" />
                                  Complete
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Complete onboarding</TooltipContent>
                            </Tooltip>
                            {inquiry.guestHasPassword && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50"
                                    onClick={() => resetAndReshare(inquiry)}
                                  >
                                    <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                                    Reshare
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reshare credentials</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {inquiry.status === "Cancelled" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-full px-4 py-2">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">Cancelled</span>
                      </div>
                      {inquiry.cancellationReason && (
                        <p className="text-xs text-slate-500 px-1">
                          Reason: {inquiry.cancellationReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="text-slate-500 font-medium">Name</TableHead>
                <TableHead className="text-slate-500 font-medium">Contact</TableHead>
                <TableHead className="text-slate-500 font-medium">Visit</TableHead>
                <TableHead className="text-slate-500 font-medium">Status</TableHead>
                <TableHead className="text-slate-500 font-medium">Room/Bed</TableHead>
                <TableHead className="text-right text-slate-500 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.map((inquiry) => (
                <TableRow key={inquiry.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {inquiry.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{inquiry.name}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`tel:${inquiry.mobile}`}
                      className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {inquiry.mobile}
                    </a>
                    {inquiry.email && (
                      <p className="text-xs text-slate-400 mt-0.5">{inquiry.email}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(inquiry.visitDate)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {inquiry.timeSlot}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        INQUIRY_STATUS_COLORS[inquiry.status] || "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {inquiry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {inquiry.roomId
                      ? `${roomMap.get(inquiry.roomId) || "—"}${inquiry.bedId ? ` / Bed ${bedMap.get(inquiry.bedId) || ""}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      {inquiry.status === "New Inquiry" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(inquiry, "Follow Up")}
                              className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 h-8 text-xs"
                            >
                              <ArrowRight className="mr-1 h-3 w-3" />
                              Follow Up
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move to Follow Up</TooltipContent>
                        </Tooltip>
                      )}
                      {inquiry.status === "Follow Up" && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(inquiry, "Visited")}
                                className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 h-8 text-xs"
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Visited
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark as Visited</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openCancelDialog(inquiry)}
                                className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Cancel
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel inquiry</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      {inquiry.status === "Visited" && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs"
                                onClick={() => openConvertDialog(inquiry)}
                              >
                                <UserCheck className="mr-1 h-3 w-3" />
                                Convert
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Convert to guest</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openCancelDialog(inquiry)}
                                className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Cancel
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel inquiry</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      {inquiry.status === "Confirmed" && (
                        <>
                          {inquiry.guestOnboardingStatus === "Approved" || inquiry.guestOnboardingStatus === "Submitted" ? (
                            <>
                              <span className="text-xs text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 font-medium">
                                <CheckCircle2 className="inline h-3 w-3 mr-1" />
                                Done
                              </span>
                              {inquiry.guestHasPassword && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 h-8 text-xs"
                                      onClick={() => resetAndReshare(inquiry)}
                                    >
                                      <Key className="mr-1 h-3 w-3" />
                                      Password
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Show / Reset password</TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs"
                                    onClick={() => resumeOnboarding(inquiry)}
                                  >
                                    <Laptop className="mr-1 h-3 w-3" />
                                    Complete
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Complete onboarding</TooltipContent>
                              </Tooltip>
                              {inquiry.guestHasPassword && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 h-8 text-xs"
                                      onClick={() => resetAndReshare(inquiry)}
                                    >
                                      <Smartphone className="mr-1 h-3 w-3" />
                                      Reshare
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Reshare credentials</TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(inquiry)}
                            className="rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete inquiry</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          </div>
        </div>
      )}

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Convert to Guest</DialogTitle>
            <DialogDescription className="text-slate-500">
              Assign a room and bed to confirm this inquiry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="room" className="text-slate-700">Room</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger id="room" className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bed" className="text-slate-700">Bed</Label>
              <Select
                value={selectedBedId}
                onValueChange={setSelectedBedId}
                disabled={!selectedRoomId || beds.length === 0}
              >
                <SelectTrigger id="bed" className="rounded-xl border-slate-200">
                  <SelectValue placeholder={beds.length === 0 ? "No available beds" : "Select bed"} />
                </SelectTrigger>
                <SelectContent>
                  {beds.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id}>
                      Bed {bed.name} (Rs. {bed.rent.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joiningDate" className="text-slate-700">Joining Date</Label>
              <Input
                id="joiningDate"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyRent" className="text-slate-700">Monthly Rent (Rs.)</Label>
              <Input
                id="monthlyRent"
                type="number"
                min={0}
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit" className="text-slate-700">Deposit (Rs.)</Label>
              <Input
                id="deposit"
                type="number"
                min={0}
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentCycleDate" className="text-slate-700">Rent Cycle Date</Label>
              <Input
                id="rentCycleDate"
                type="date"
                value={rentCycleDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const day = new Date(val).getDate();
                    setRentCycleDate(day.toString());
                  } else {
                    setRentCycleDate("");
                  }
                }}
                className="rounded-xl border-slate-200"
              />
              {rentCycleDate && (
                <p className="text-xs text-slate-500">
                  Rent cycle: {rentCycleDate}
                  {rentCycleDate === "1"
                    ? "st"
                    : rentCycleDate === "2"
                    ? "nd"
                    : rentCycleDate === "3"
                    ? "rd"
                    : "th"}{" "}
                  of every month
                </p>
              )}
            </div>

            {rentCalculation && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Calculator className="w-4 h-4 text-teal-600" />
                  Rent Calculation
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Per Day Rent</span>
                    <span className="text-slate-900">Rs. {rentCalculation.perDayRent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Difference Days</span>
                    <span className="text-slate-900">{rentCalculation.differenceDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rent Difference</span>
                    <span className="font-medium text-amber-600">
                      Rs. {rentCalculation.differenceAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 my-2 pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Advance Rent</span>
                      <span className="text-slate-900">Rs. {Number(monthlyRent).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security Deposit</span>
                      <span className="text-slate-900">Rs. {Number(deposit || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-900 pt-1">
                      <span>Total Payable</span>
                      <span>Rs. {rentCalculation.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)} className="rounded-full border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleConvert} className="rounded-full bg-teal-600 hover:bg-teal-700 text-white">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the inquiry from {selectedDeleteInquiry?.name || "this guest"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Cancel Inquiry</DialogTitle>
            <DialogDescription className="text-slate-500">
              Please provide a reason for cancelling this inquiry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cancelReason" className="text-slate-700">Cancellation Reason</Label>
              <Input
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Found another place"
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="rounded-full border-slate-200">
              Close
            </Button>
            <Button variant="destructive" onClick={handleCancel} className="rounded-full">
              Cancel Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Choose Option Dialog */}
      <Dialog open={optionDialogOpen} onOpenChange={(open) => { setOptionDialogOpen(open); if (!open) setIsResumeMode(false); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {isResumeMode ? "Resume Onboarding" : "Choose How to Proceed"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {isResumeMode
                ? "This guest's onboarding is pending. How would you like to continue?"
                : "How would you like the onboarding to be completed?"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Option 1: Guest completes */}
            <button
              onClick={() => isResumeMode ? processResume("guest") : processConvert("guest")}
              disabled={convertLoading}
              className="w-full text-left rounded-xl border border-slate-100 bg-white p-5 hover:border-teal-200 hover:bg-teal-50/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Smartphone className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Let Guest Complete</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isResumeMode
                      ? "Generate or resend login credentials. The guest will log in and complete onboarding themselves."
                      : "Generate login credentials for the guest. They will log in to the guest portal and complete onboarding themselves."}
                  </p>
                </div>
              </div>
            </button>

            {/* Option 2: Admin completes */}
            <button
              onClick={() => isResumeMode ? processResume("admin") : processConvert("admin")}
              disabled={convertLoading}
              className="w-full text-left rounded-xl border border-slate-100 bg-white p-5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Laptop className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Complete by Admin</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Fill out the onboarding form on behalf of the guest right now.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guest Credentials Dialog */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Guest Credentials</DialogTitle>
            <DialogDescription className="text-slate-500">
              Share these login details with the guest. They can use them to access the guest portal and complete onboarding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {guestCredentials && (
              <>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                  <div>
                    <Label className="text-xs text-slate-500">Guest Portal URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-medium text-slate-700 flex-1">{`${window.location.origin}/guest/login`}</p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 rounded-full"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/guest/login`);
                          toast.success("URL copied");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <Label className="text-xs text-slate-500">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-medium text-slate-700 flex-1">{guestCredentials.email}</p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 rounded-full"
                        onClick={() => {
                          navigator.clipboard.writeText(guestCredentials.email);
                          toast.success("Email copied");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <Label className="text-xs text-slate-500">Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold text-slate-900 flex-1 font-mono">{guestCredentials.password}</p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 rounded-full"
                        onClick={() => {
                          navigator.clipboard.writeText(guestCredentials.password);
                          toast.success("Password copied");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => {
                    const text = `The Waghad Villa - Guest Portal Login\n\nURL: ${window.location.origin}/guest/login\nEmail: ${guestCredentials.email}\nPassword: ${guestCredentials.password}\n\nPlease log in and complete your onboarding.`;
                    navigator.clipboard.writeText(text);
                    toast.success("All credentials copied");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All Details
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Onboarding Wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          {wizardToken && (
            <OnboardingWizard
              token={wizardToken}
              inline
              autoApprove
              onCredentials={(creds) => {
                setGuestCredentials(creds);
                setWizardOpen(false);
                setCredentialsDialogOpen(true);
                fetchInquiries(activeTab === "All" ? undefined : activeTab);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Onboarding Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Complete Onboarding</DialogTitle>
            <DialogDescription className="text-slate-500">
              Click below to fill out the onboarding form for this guest.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm break-all text-slate-700">
              {onboardingLink}
            </div>
            <Button
              className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                window.open(onboardingLink.replace("/onboarding/", "/admin/onboarding/"), "_blank");
              }}
            >
              <Laptop className="mr-2 h-4 w-4" />
              Fill Onboarding Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
