"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
  Users,
  Eye,
  Pencil,
  ArrowRightLeft,
  UserX,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  Home,
  BedDouble,
  Calendar,
  IndianRupee,
  AlertTriangle,
  FileImage,
  Briefcase,
  Shield,
  Zap,
  MessageSquare,
  CreditCard,
  X,
  Download,
  Receipt,
  UserPlus,
  Wallet,
  Plus,
  Link2,
  Copy,
  CheckCheck,
} from "lucide-react";
import { generateGuestPDF } from "@/lib/guest-pdf";
import { AddGuestModal } from "@/components/admin/add-guest-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { MobileTableWrapper, MobileCards, MobileCard } from "@/components/admin/mobile-table";
import { formatDate, formatCurrency } from "@/lib/formatters";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: y, label: String(y) };
});

// ─── Types ───────────────────────────────────────────────────────────

type Room = { id: string; name: string; floor?: { name: string } };
type Bed = { id: string; name: string };

type GuestSummary = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  status: string;
  joiningDate: string | null;
  leavingDate: string | null;
  monthlyRent: number | null;
  totalDue: number;
  room: Room | null;
  bed: Bed | null;
};

type LedgerEntry = {
  id: string;
  description: string;
  amount: number;
  paid: number;
  due: number;
  status: string;
  createdAt: string;
};

type PaymentEntry = {
  id: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  transactionId: string | null;
  proofImages: string[];
  depositAmount: number | null;
  rentAmount: number | null;
  rentForMonth: number | null;
  rentForYear: number | null;
  createdAt: string;
};

type ComplaintEntry = {
  id: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
};

type ElectricityEntry = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  bill: {
    month: number;
    year: number;
    totalAmount: number;
    room: { name: string };
  } | null;
  bed: { name: string } | null;
};

type OnboardingData = {
  step1Personal?: {
    fullName?: string;
    dob?: string;
    bloodGroup?: string;
    address?: string;
  } | null;
  step2Emergency?: Array<{
    name: string;
    relation: string;
    mobile: string;
  }> | null;
  step3Job?: {
    companyName?: string;
    occupation?: string;
    officeAddress?: string;
  } | null;
  step4Documents?: {
    aadhar?: string;
    pan?: string;
    photo?: string;
  } | null;
};

type GuestDetail = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  status: string;
  joiningDate: string | null;
  leavingDate: string | null;
  monthlyRent: number | null;
  deposit: number | null;
  room: (Room & { floor?: { name: string }; amenities?: string[]; wifiName?: string | null; wifiPassword?: string | null; sharingType?: string }) | null;
  bed: Bed | null;
  onboardingData: OnboardingData | null;
  ledger: LedgerEntry[];
  payments: PaymentEntry[];
  complaints: ComplaintEntry[];
  electricitySplits: ElectricityEntry[];
};

// ─── Helpers ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Notice Period": "bg-amber-100 text-amber-700 border-amber-200",
  Inactive: "bg-slate-100 text-slate-600 border-slate-200",
  "Onboarding Started": "bg-blue-100 text-blue-700 border-blue-200",
  "Onboarding Submitted": "bg-purple-100 text-purple-700 border-purple-200",
  "Active (Pending Move-In)": "bg-purple-100 text-purple-700 border-purple-200",
};

const LEDGER_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Partial: "bg-blue-100 text-blue-700",
  Overdue: "bg-red-100 text-red-700",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ─── Main Page ───────────────────────────────────────────────────────

export default function GuestsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<GuestSummary[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Detail modal
  const [detailGuest, setDetailGuest] = useState<GuestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Edit drawer
  const [editGuest, setEditGuest] = useState<GuestSummary | null>(null);
  const [editForm, setEditForm] = useState({ name: "", mobile: "", email: "", monthlyRent: "", status: "" });
  const [saving, setSaving] = useState(false);

  // Deactivate
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Resend onboarding link
  const [resendLinkGuestId, setResendLinkGuestId] = useState<string | null>(null);
  const [resendLinkLoading, setResendLinkLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Image viewer
  const [viewImage, setViewImage] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (roomFilter) params.append("roomId", roomFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", String(page));
      params.append("limit", String(limit));
      const res = await fetch(`/api/admin/guests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGuests(data.guests || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roomFilter, sortBy, sortOrder, page, limit]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms?.map((r: Room) => ({ id: r.id, name: r.name })) || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setActiveTab("personal");
    try {
      const res = await fetch(`/api/admin/guests/${id}`);
      if (res.ok) {
        setDetailGuest(await res.json());
      } else {
        toast.error("Failed to load guest details");
      }
    } catch {
      toast.error("Failed to load guest details");
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (guest: GuestSummary) => {
    if (guest.status === "Onboarding Started" || guest.status === "Pending Onboarding") {
      const loadingToast = toast.loading("Resuming onboarding...");
      try {
        const res = await fetch("/api/admin/onboarding-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId: guest.id }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        toast.dismiss(loadingToast);
        
        // Open the onboarding flow
        window.open(data.link, '_blank');
      } catch {
        toast.dismiss(loadingToast);
        toast.error("Failed to resume onboarding");
      }
      return;
    }

    setEditGuest(guest);
    setEditForm({
      name: guest.name,
      mobile: guest.mobile,
      email: guest.email,
      monthlyRent: guest.monthlyRent ? String(guest.monthlyRent) : "",
      status: guest.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editGuest) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/guests/${editGuest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          mobile: editForm.mobile,
          email: editForm.email,
          monthlyRent: editForm.monthlyRent ? Number(editForm.monthlyRent) : null,
          status: editForm.status,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      toast.success("Guest updated");
      setEditGuest(null);
      fetchGuests();
      if (detailGuest?.id === editGuest.id) {
        openDetail(editGuest.id);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setDeactivatingId(id);
    try {
      const res = await fetch(`/api/admin/guests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Guest deactivated");
      fetchGuests();
      if (detailGuest?.id === id) setDetailGuest(null);
    } catch {
      toast.error("Failed to deactivate");
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleResendLink = async (guestId: string) => {
    setResendLinkGuestId(guestId);
    setGeneratedLink(null);
    setLinkCopied(false);
    setResendLinkLoading(true);
    try {
      const res = await fetch("/api/admin/onboarding-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setGeneratedLink(data.link);
    } catch {
      toast.error("Failed to generate onboarding link");
      setResendLinkGuestId(null);
    } finally {
      setResendLinkLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guest Management</h1>
          <p className="text-sm text-slate-500 mt-1">View, search, and manage all guests</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="rounded-full bg-teal-600 hover:bg-teal-700 text-white w-fit">
          <UserPlus className="mr-1.5 h-4 w-4" /> Add Guest
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Guests" value={total} icon={Users} color="text-teal-600" bg="bg-teal-50" />
        <StatCard label="Active" value={guests.filter((g) => g.status === "Active").length} icon={User} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Notice Period" value={guests.filter((g) => g.status === "Notice Period").length} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Total Due" value={formatCurrency(guests.reduce((s, g) => s + g.totalDue, 0))} icon={IndianRupee} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl border-slate-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Active (Pending Move-In)">Move-In Scheduled</option>
          <option value="Notice Period">Notice Period</option>
          <option value="Onboarding Started">Onboarding In Progress</option>
          <option value="Pending Onboarding">Pending Onboarding</option>
          <option value="Onboarding Submitted">Onboarding Submitted</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={roomFilter}
          onChange={(e) => { setRoomFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">All Rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split("-");
            setSortBy(sb);
            setSortOrder(so as "asc" | "desc");
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="joiningDate-desc">Joining Date (Latest)</option>
          <option value="joiningDate-asc">Joining Date (Earliest)</option>
          <option value="dueAmount-desc">Due Amount (High-Low)</option>
          <option value="dueAmount-asc">Due Amount (Low-High)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <MobileTableWrapper>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
                <TableHead className="text-xs font-medium text-slate-500">Name</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Mobile</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Room</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Bed</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Joining</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Rent</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Due</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-0">
                    <DataTableSkeleton columns={9} rows={5} showHeader={false} />
                  </TableCell>
                </TableRow>
              ) : guests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-0">
                    <EmptyState
                      icon={Users}
                      title="No guests found"
                      subtitle={search || statusFilter || roomFilter ? "Try adjusting your filters" : "Guests will appear here once they are onboarded."}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                guests.map((guest) => (
                  <TableRow key={guest.id} className="border-slate-100 hover:bg-slate-50/50">
                    <TableCell>
                      <button
                        onClick={() => openDetail(guest.id)}
                        className="text-sm font-medium text-slate-900 hover:text-teal-600 transition-colors text-left"
                      >
                        {guest.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{guest.mobile}</TableCell>
                    <TableCell className="text-sm text-slate-600">{guest.room?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{guest.bed?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(guest.joiningDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-full text-[10px] font-medium ${STATUS_COLORS[guest.status] || "bg-slate-100 text-slate-600"}`}>
                        {guest.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatCurrency(guest.monthlyRent)}
                    </TableCell>
                    <TableCell className={`text-sm font-semibold ${guest.totalDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCurrency(guest.totalDue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => openDetail(guest.id)} className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(guest)} className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit guest</TooltipContent>
                        </Tooltip>
                        {/* Resend onboarding link — only for in-progress guests */}
                        {(guest.status === "Onboarding Started" || guest.status === "Pending Onboarding") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResendLink(guest.id)}
                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Resend onboarding link</TooltipContent>
                          </Tooltip>
                        )}
                        {/* Transfer bed only for active guests */}
                        {guest.status !== "Onboarding Started" && guest.status !== "Pending Onboarding" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600">
                                <Link href={`/admin/bed-transfers?guest=${guest.id}`}>
                                  <ArrowRightLeft className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Transfer bed</TooltipContent>
                          </Tooltip>
                        )}
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={deactivatingId === guest.id}
                                  className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                                >
                                  {deactivatingId === guest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>{guest.status === "Onboarding Started" || guest.status === "Pending Onboarding" ? "Cancel & free bed" : "Deactivate guest"}</TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{guest.status === "Onboarding Started" || guest.status === "Pending Onboarding" ? "Cancel Onboarding?" : "Deactivate Guest?"}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {guest.status === "Onboarding Started" || guest.status === "Pending Onboarding"
                                  ? "This will cancel the onboarding, free the reserved bed, and remove this guest. This cannot be undone."
                                  : "This will free their bed and mark them as inactive. This action cannot be undone."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeactivate(guest.id)} className="bg-red-600 hover:bg-red-700">
                                {guest.status === "Onboarding Started" || guest.status === "Pending Onboarding" ? "Cancel Onboarding" : "Deactivate"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </MobileTableWrapper>

        {!loading && guests.length > 0 && (
          <MobileCards
            data={guests}
            className="p-4"
            renderCard={(guest) => (
              <MobileCard
                title={
                  <div className="flex items-center justify-between w-full">
                    <span>{guest.name}</span>
                    <Badge variant="outline" className={`rounded-full text-[10px] font-medium ${STATUS_COLORS[guest.status] || "bg-slate-100 text-slate-600"}`}>
                      {guest.status}
                    </Badge>
                  </div>
                }
                actions={
                  <>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetail(guest.id)}>View</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(guest)}>Edit</Button>
                  </>
                }
              >
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-medium text-slate-900">{guest.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room/Bed:</span>
                  <span className="font-medium text-slate-900">{guest.room?.name || "—"} / {guest.bed?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Joining Date:</span>
                  <span className="font-medium text-slate-900">{formatDate(guest.joiningDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rent:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(guest.monthlyRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Amount:</span>
                  <span className={`font-semibold ${guest.totalDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatCurrency(guest.totalDue)}
                  </span>
                </div>
              </MobileCard>
            )}
          />
        )}


        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 p-0 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-600">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 p-0 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Resend Onboarding Link Modal ─────────────────────────── */}
      <Dialog open={!!resendLinkGuestId} onOpenChange={(open) => { if (!open) { setResendLinkGuestId(null); setGeneratedLink(null); setLinkCopied(false); } }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" />
              Resend Onboarding Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {resendLinkLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-teal-500 animate-spin" />
                <span className="ml-3 text-sm text-slate-500">Generating secure link…</span>
              </div>
            ) : generatedLink ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Share this link with the guest. It is valid for <span className="font-semibold text-slate-800">7 days</span> and will allow them to continue their onboarding from where they left off.
                </p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <span className="text-xs text-slate-600 truncate flex-1 font-mono">{generatedLink}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyLink}
                    className={`h-7 px-2 shrink-0 transition-colors ${linkCopied ? "text-emerald-600 hover:text-emerald-700" : "text-blue-500 hover:text-blue-700"}`}
                  >
                    {linkCopied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {linkCopied && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Link copied to clipboard!</p>
                )}
                <Button
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleCopyLink}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {linkCopied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Guest Detail: Custom Overlay Modal ──────────────────────── */}
      {(!!detailGuest || detailLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailGuest(null); }}
        >
          {/* ══════════════ DESKTOP MODAL ══════════════ */}
          <div className="hidden md:flex w-full max-w-[1080px] mx-4 h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
                  <p className="text-sm text-slate-400 font-medium">Loading guest profile…</p>
                </div>
              </div>
            ) : detailGuest ? (
              <>
                {/* Left Sidebar */}
                <div className="w-[240px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                  {/* Profile */}
                  <div className="px-5 py-6 border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative shrink-0">
                        {detailGuest.onboardingData?.step4Documents?.photo ? (
                          <img src={detailGuest.onboardingData.step4Documents.photo} alt={detailGuest.name}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-xl font-bold text-white shadow-md">
                            {detailGuest.name[0].toUpperCase()}
                          </div>
                        )}
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-50 ${
                          detailGuest.status === "Active" ? "bg-emerald-500" :
                          detailGuest.status === "Notice Period" ? "bg-amber-500" :
                          detailGuest.status === "Inactive" ? "bg-slate-400" : "bg-blue-500"
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate leading-tight">{detailGuest.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{detailGuest.mobile}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          detailGuest.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                          detailGuest.status === "Notice Period" ? "bg-amber-100 text-amber-700" :
                          detailGuest.status === "Inactive" ? "bg-slate-100 text-slate-600" :
                          "bg-blue-100 text-blue-700"
                        }`}>{detailGuest.status}</span>
                      </div>
                    </div>
                    {/* Stat chips */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Home className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs text-slate-500">Room</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{detailGuest.room?.name || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs text-slate-500">Bed</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{detailGuest.bed?.name || "—"}</span>
                      </div>
                      <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                        detailGuest.ledger.reduce((s, l) => s + l.due, 0) > 0
                          ? "bg-red-50 border-red-200"
                          : "bg-emerald-50 border-emerald-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          <IndianRupee className={`h-3.5 w-3.5 ${detailGuest.ledger.reduce((s, l) => s + l.due, 0) > 0 ? "text-red-500" : "text-emerald-500"}`} />
                          <span className={`text-xs font-medium ${detailGuest.ledger.reduce((s, l) => s + l.due, 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>Due</span>
                        </div>
                        <span className={`text-xs font-bold ${detailGuest.ledger.reduce((s, l) => s + l.due, 0) > 0 ? "text-red-700" : "text-emerald-700"}`}>
                          {formatCurrency(detailGuest.ledger.reduce((s, l) => s + l.due, 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nav */}
                  <nav className="flex-1 overflow-y-auto py-2 px-2">
                    {[
                      { id: "personal", label: "Personal Info", icon: User },
                      { id: "emergency", label: "Emergency", icon: Shield },
                      { id: "job", label: "Job Details", icon: Briefcase },
                      { id: "documents", label: "KYC Docs", icon: FileImage },
                      { id: "room", label: "Room & Bed", icon: Home },
                      { id: "payments", label: "Payments", icon: Receipt },
                      { id: "ledger", label: "Ledger", icon: CreditCard },
                      { id: "complaints", label: "Complaints", icon: MessageSquare },
                      { id: "electricity", label: "Electricity", icon: Zap },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left mb-0.5 ${
                            isActive
                              ? "bg-teal-600 text-white font-semibold shadow-sm"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                          }`}>
                          <Icon className="h-4 w-4 shrink-0" />{tab.label}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Footer actions */}
                  <div className="p-3 border-t border-slate-200 space-y-2">
                    <Link href={`/admin/bed-transfers?guest=${detailGuest.id}`}
                      className="flex items-center justify-center gap-2 w-full h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer Room/Bed
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button disabled={deactivatingId === detailGuest.id}
                          className="flex items-center justify-center gap-2 w-full h-9 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors border border-red-200">
                          {deactivatingId === detailGuest.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                          Deactivate Guest
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate Guest?</AlertDialogTitle>
                          <AlertDialogDescription>This will free their bed and mark them as inactive. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeactivate(detailGuest.id)} className="bg-red-600 hover:bg-red-700">Deactivate</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Right content panel */}
                <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
                  {/* Top bar */}
                  <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 capitalize">
                        {["personal","emergency","job","documents","room","payments","ledger","complaints","electricity"].includes(activeTab)
                          ? { personal: "Personal Info", emergency: "Emergency Contacts", job: "Job Details", documents: "KYC Documents", room: "Room & Bed", payments: "Payments", ledger: "Ledger", complaints: "Complaints", electricity: "Electricity" }[activeTab]
                          : activeTab}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{detailGuest.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(detailGuest as unknown as GuestSummary)}
                        className="h-8 px-3 text-xs rounded-lg border-slate-200 hover:border-teal-300 hover:text-teal-700 font-medium">
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
                      </Button>
                      <Button variant="outline" size="sm"
                        onClick={() => { const doc = generateGuestPDF(detailGuest as unknown as Parameters<typeof generateGuestPDF>[0]); doc.save(`guest-profile-${detailGuest.name.replace(/\s+/g, "-").toLowerCase()}.pdf`); }}
                        className="h-8 px-3 text-xs rounded-lg border-slate-200 font-medium">
                        <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
                      </Button>
                      <button onClick={() => setDetailGuest(null)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors ml-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {/* Scrollable tab content */}
                  <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 min-h-full">
                      {activeTab === "personal" && <PersonalTab guest={detailGuest} />}
                      {activeTab === "emergency" && <EmergencyTab guest={detailGuest} />}
                      {activeTab === "job" && <JobTab guest={detailGuest} />}
                      {activeTab === "documents" && <DocumentsTab guest={detailGuest} onViewImage={setViewImage} />}
                      {activeTab === "room" && <RoomTab guest={detailGuest} />}
                      {activeTab === "payments" && <PaymentsTab guest={detailGuest} onViewImage={setViewImage} onRefresh={() => openDetail(detailGuest.id)} />}
                      {activeTab === "ledger" && <LedgerTab guest={detailGuest} />}
                      {activeTab === "complaints" && <ComplaintsTab guest={detailGuest} />}
                      {activeTab === "electricity" && <ElectricityTab guest={detailGuest} />}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* ══════════════ MOBILE SHEET ══════════════ */}
          <div className="md:hidden fixed inset-x-0 bottom-0 h-[93dvh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
              </div>
            ) : detailGuest ? (
              <>
                {/* Mobile header */}
                <div className="shrink-0 px-4 pt-3 pb-3 border-b border-slate-100 bg-white">
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
                  <div className="flex items-center gap-3">
                    {detailGuest.onboardingData?.step4Documents?.photo ? (
                      <img src={detailGuest.onboardingData.step4Documents.photo} alt={detailGuest.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
                        {detailGuest.name[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-slate-900 truncate leading-tight">{detailGuest.name}</h2>
                      <p className="text-xs text-slate-500">{detailGuest.mobile}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          detailGuest.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                          detailGuest.status === "Notice Period" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                        }`}>{detailGuest.status}</span>
                        {detailGuest.room && <span className="text-[10px] text-slate-400">{detailGuest.room.name} · Bed {detailGuest.bed?.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => openEdit(detailGuest as unknown as GuestSummary)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDetailGuest(null)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Mobile stat row */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-slate-50 rounded-lg px-2 py-1.5 text-center border border-slate-100">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wide font-medium">Room</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{detailGuest.room?.name || "—"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-2 py-1.5 text-center border border-slate-100">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wide font-medium">Bed</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{detailGuest.bed?.name || "—"}</p>
                    </div>
                    <div className={`rounded-lg px-2 py-1.5 text-center border ${detailGuest.ledger.reduce((s,l) => s+l.due, 0) > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wide font-medium">Due</p>
                      <p className={`text-xs font-bold mt-0.5 ${detailGuest.ledger.reduce((s,l) => s+l.due, 0) > 0 ? "text-red-700" : "text-emerald-700"}`}>
                        {formatCurrency(detailGuest.ledger.reduce((s, l) => s + l.due, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile tab bar */}
                <div className="shrink-0 bg-white border-b border-slate-100">
                  <div className="flex gap-1 overflow-x-auto px-3 py-2.5" style={{ scrollbarWidth: "none" }}>
                    {[
                      { id: "personal", label: "Personal", icon: User },
                      { id: "emergency", label: "Emergency", icon: Shield },
                      { id: "job", label: "Job", icon: Briefcase },
                      { id: "documents", label: "KYC", icon: FileImage },
                      { id: "room", label: "Room", icon: Home },
                      { id: "payments", label: "Payments", icon: Receipt },
                      { id: "ledger", label: "Ledger", icon: CreditCard },
                      { id: "complaints", label: "Issues", icon: MessageSquare },
                      { id: "electricity", label: "Electric", icon: Zap },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                            activeTab === tab.id
                              ? "bg-teal-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}>
                          <Icon className="h-3 w-3" />{tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile scrollable content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/60 p-3">
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                    {activeTab === "personal" && <PersonalTab guest={detailGuest} />}
                    {activeTab === "emergency" && <EmergencyTab guest={detailGuest} />}
                    {activeTab === "job" && <JobTab guest={detailGuest} />}
                    {activeTab === "documents" && <DocumentsTab guest={detailGuest} onViewImage={setViewImage} />}
                    {activeTab === "room" && <RoomTab guest={detailGuest} />}
                    {activeTab === "payments" && <PaymentsTab guest={detailGuest} onViewImage={setViewImage} onRefresh={() => openDetail(detailGuest.id)} />}
                    {activeTab === "ledger" && <LedgerTab guest={detailGuest} />}
                    {activeTab === "complaints" && <ComplaintsTab guest={detailGuest} />}
                    {activeTab === "electricity" && <ElectricityTab guest={detailGuest} />}
                  </div>
                </div>

                {/* Mobile action bar */}
                <div className="shrink-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-3">
                  <Link href={`/admin/bed-transfers?guest=${detailGuest.id}`}
                    className="flex-1 flex items-center justify-center gap-2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                    <ArrowRightLeft className="h-4 w-4" /> Transfer
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button disabled={deactivatingId === detailGuest.id}
                        className="flex-1 flex items-center justify-center gap-2 h-11 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors border border-red-200">
                        {deactivatingId === detailGuest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                        Deactivate
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Guest?</AlertDialogTitle>
                        <AlertDialogDescription>This will free their bed and mark them inactive.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeactivate(detailGuest.id)} className="bg-red-600 hover:bg-red-700">Deactivate</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Edit Drawer ─────────────────────────────────────────────── */}
      <Sheet open={!!editGuest} onOpenChange={(open) => { if (!open) setEditGuest(null); }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Guest</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Mobile</Label>
              <Input value={editForm.mobile} onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Monthly Rent (₹)</Label>
              <Input type="number" value={editForm.monthlyRent} onChange={(e) => setEditForm((f) => ({ ...f, monthlyRent: e.target.value }))} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Active (Pending Move-In)">Move-In Scheduled</SelectItem>
                  <SelectItem value="Notice Period">Notice Period</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveEdit} disabled={saving} className="rounded-full bg-teal-600 hover:bg-teal-700 text-white">
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditGuest(null)} className="rounded-full">Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AddGuestModal open={addModalOpen} onOpenChange={setAddModalOpen} onSuccess={fetchGuests} />

      {/* ─── Image Viewer ────────────────────────────────────────────── */}
      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="absolute top-2 right-2 z-10">
            <DialogTitle className="sr-only">Document Viewer</DialogTitle>
            <Button size="sm" variant="ghost" onClick={() => setViewImage(null)} className="h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          {viewImage && (
            <img src={viewImage} alt="Document" className="w-full max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: string | number; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full ${bg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value || "—"}</p>
      </div>
    </div>
  );
}

function PersonalTab({ guest }: { guest: GuestDetail }) {
  const step1 = guest.onboardingData?.step1Personal;
  const photo = guest.onboardingData?.step4Documents?.photo;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
      <DetailRow label="Full Name" value={guest.name} icon={User} />
      <DetailRow label="Mobile" value={guest.mobile} icon={Phone} />
      <DetailRow label="Email" value={guest.email} icon={Mail} />
      <DetailRow label="Date of Birth" value={formatDate(step1?.dob)} icon={Calendar} />
      <DetailRow label="Blood Group" value={step1?.bloodGroup} icon={Shield} />
      <DetailRow label="Address" value={step1?.address} icon={Home} />
      <DetailRow label="Joining Date" value={formatDate(guest.joiningDate)} icon={Calendar} />
      <DetailRow label="Status" value={guest.status} icon={User} />
      {photo ? (
        <div className="sm:col-span-2">
          <p className="text-xs text-slate-500 mb-2">Photo</p>
          <img src={photo} alt="Guest" className="h-32 w-32 object-cover rounded-xl border border-slate-200" />
        </div>
      ) : null}
    </div>
  );
}

function EmergencyTab({ guest }: { guest: GuestDetail }) {
  const raw = guest.onboardingData?.step2Emergency;
  const contacts = Array.isArray(raw) ? raw : [];
  if (contacts.length === 0) {
    return <EmptyState icon={Shield} title="No emergency contacts" subtitle="No emergency contacts have been added for this guest." />;
  }
  return (
    <div className="space-y-3">
      {contacts.map((c, i) => (
        <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DetailRow label="Name" value={c.name} icon={User} />
            <DetailRow label="Relation" value={c.relation} icon={Shield} />
            <DetailRow label="Mobile" value={c.mobile} icon={Phone} />
          </div>
        </div>
      ))}
    </div>
  );
}

function JobTab({ guest }: { guest: GuestDetail }) {
  const step3 = guest.onboardingData?.step3Job;
  if (!step3) {
    return <EmptyState icon={Briefcase} title="No job details" subtitle="No job details have been added for this guest." />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
      <DetailRow label="Company" value={step3.companyName} icon={Briefcase} />
      <DetailRow label="Occupation" value={step3.occupation} icon={User} />
      <DetailRow label="Office Address" value={step3.officeAddress} icon={Home} />
    </div>
  );
}

function DocumentsTab({ guest, onViewImage }: { guest: GuestDetail; onViewImage: (url: string) => void }) {
  const docs = guest.onboardingData?.step4Documents;
  const items = [
    { label: "Aadhar (Front)", url: docs?.aadhar },
    { label: "Aadhar (Back)", url: docs?.aadharBack },
    { label: "PAN Card", url: docs?.pan },
    { label: "Passport Photo", url: docs?.photo },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-xs font-medium text-slate-600 mb-3">{item.label}</p>
          {item.url ? (
            <button onClick={() => onViewImage(item.url!)} className="relative group mx-auto">
              <img src={item.url} alt={item.label} className="h-32 w-full object-contain rounded-lg border border-slate-200 bg-white" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
            </button>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-300 text-xs">Not uploaded</div>
          )}
        </div>
      ))}
    </div>
  );
}

function RoomTab({ guest }: { guest: GuestDetail }) {
  if (!guest.room) {
    return <EmptyState icon={Home} title="No room assigned" subtitle="This guest is not assigned to any room yet." />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
      <DetailRow label="Room" value={`${guest.room.name} (${guest.room.floor?.name || ""})`} icon={Home} />
      <DetailRow label="Bed" value={guest.bed?.name} icon={BedDouble} />
      <DetailRow label="Sharing Type" value={guest.room.sharingType} icon={Users} />
      <DetailRow label="WiFi Name" value={guest.room.wifiName} icon={Zap} />
      <DetailRow label="WiFi Password" value={guest.room.wifiPassword} icon={Shield} />
      <DetailRow label="Monthly Rent" value={formatCurrency(guest.monthlyRent)} icon={IndianRupee} />
      <DetailRow label="Deposit" value={formatCurrency(guest.deposit)} icon={IndianRupee} />
      {guest.room.amenities && guest.room.amenities.length > 0 && (
        <div className="sm:col-span-2">
          <p className="text-xs text-slate-500 mb-2">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {guest.room.amenities.map((a) => (
              <Badge key={a} variant="outline" className="rounded-full text-xs">{a}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LedgerTab({ guest }: { guest: GuestDetail }) {
  if (guest.ledger.length === 0) {
    return <EmptyState icon={CreditCard} title="No ledger entries" subtitle="No ledger entries found for this guest." />;
  }

  const getLedgerTypeBadge = (description: string) => {
    if (description.includes("Security Deposit")) {
      return <Badge variant="outline" className="rounded-full text-[10px] bg-blue-50 text-blue-700 border-blue-100 mr-2">Deposit</Badge>;
    }
    if (description.includes("Advance Rent")) {
      return <Badge variant="outline" className="rounded-full text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 mr-2">Rent</Badge>;
    }
    if (description.includes("Rent Difference")) {
      return <Badge variant="outline" className="rounded-full text-[10px] bg-amber-50 text-amber-700 border-amber-100 mr-2">Diff</Badge>;
    }
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
            <TableHead className="text-xs font-medium text-slate-500">Date</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Description</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Amount</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Paid</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Due</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guest.ledger.map((entry) => (
            <TableRow key={entry.id} className="border-slate-100 hover:bg-slate-50/50">
              <TableCell className="text-xs text-slate-500">{formatDate(entry.createdAt)}</TableCell>
              <TableCell className="text-sm text-slate-700">
                <div className="flex items-center">
                  {getLedgerTypeBadge(entry.description)}
                  {entry.description}
                </div>
              </TableCell>
              <TableCell className="text-sm text-slate-700">{formatCurrency(entry.amount)}</TableCell>
              <TableCell className="text-sm text-slate-700">{formatCurrency(entry.paid)}</TableCell>
              <TableCell className={`text-sm font-semibold ${entry.due > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(entry.due)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-full text-[10px] font-medium ${LEDGER_STATUS_COLORS[entry.status] || "bg-slate-100 text-slate-600"}`}>
                  {entry.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ComplaintsTab({ guest }: { guest: GuestDetail }) {
  if (guest.complaints.length === 0) {
    return <EmptyState icon={MessageSquare} title="No complaints" subtitle="This guest has not raised any complaints." />;
  }
  return (
    <div className="space-y-3">
      {guest.complaints.map((c) => (
        <div key={c.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-900">{c.category}</span>
            <Badge variant="outline" className={`rounded-full text-[10px] font-medium ${
              c.priority === "High" ? "bg-red-100 text-red-700" : c.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}>{c.priority}</Badge>
            <Badge variant="outline" className={`rounded-full text-[10px] font-medium ${
              c.status === "Resolved" ? "bg-emerald-100 text-emerald-700" : c.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
            }`}>{c.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">{formatDate(c.createdAt)}</p>
          <p className="text-sm text-slate-700 mt-1">{c.description}</p>
        </div>
      ))}
    </div>
  );
}

function ElectricityTab({ guest }: { guest: GuestDetail }) {
  if (guest.electricitySplits.length === 0) {
    return <EmptyState icon={Zap} title="No electricity charges" subtitle="No electricity bill splits found for this guest." />;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
            <TableHead className="text-xs font-medium text-slate-500">Month</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Room</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Bed</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Amount</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guest.electricitySplits.map((s) => (
            <TableRow key={s.id} className="border-slate-100 hover:bg-slate-50/50">
              <TableCell className="text-sm text-slate-700">{s.bill ? `${MONTHS[s.bill.month - 1]} ${s.bill.year}` : "—"}</TableCell>
              <TableCell className="text-sm text-slate-700">{s.bill?.room.name || "—"}</TableCell>
              <TableCell className="text-sm text-slate-700">{s.bed?.name || "—"}</TableCell>
              <TableCell className="text-sm font-semibold text-slate-900">{formatCurrency(s.amount)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-full text-[10px] font-medium ${
                  s.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>{s.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PaymentsTab({ guest, onViewImage, onRefresh }: { guest: GuestDetail; onViewImage: (url: string) => void; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [rentForMonth, setRentForMonth] = useState(String(new Date().getMonth() + 1));
  const [rentForYear, setRentForYear] = useState(String(new Date().getFullYear()));
  const [method, setMethod] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const PAYMENT_STATUS_COLORS: Record<string, string> = {
    Approved: "bg-emerald-100 text-emerald-700",
    Uploaded: "bg-amber-100 text-amber-700",
    Rejected: "bg-red-100 text-red-700",
    Held: "bg-blue-100 text-blue-700",
  };

  const resetForm = () => {
    setAmount("");
    setDepositAmount("");
    setRentAmount("");
    setRentForMonth(String(new Date().getMonth() + 1));
    setRentForYear(String(new Date().getFullYear()));
    setMethod("Cash");
    setTransactionId("");
    setFormError("");
  };

  const handleSubmit = async () => {
    setFormError("");
    const total = Number(amount || 0);
    const dep = Number(depositAmount || 0);
    const rent = Number(rentAmount || 0);

    if (!total || total <= 0) {
      setFormError("Please enter a valid amount");
      return;
    }
    if (dep + rent !== total) {
      setFormError(`Deposit (₹${dep}) + Rent (₹${rent}) must equal Total (₹${total})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: guest.id,
          amount: total,
          type: "rent",
          method,
          transactionId: transactionId || undefined,
          depositAmount: dep > 0 ? dep : undefined,
          rentAmount: rent > 0 ? rent : undefined,
          rentForMonth: rent > 0 ? Number(rentForMonth) : undefined,
          rentForYear: rent > 0 ? Number(rentForYear) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add payment");
      toast.success("Payment recorded successfully");
      setShowForm(false);
      resetForm();
      onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Payment Button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {/* Add Payment Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-teal-600" />
            Record New Payment
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Total Amount (₹)</Label>
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Deposit (₹)</Label>
              <Input type="number" min={0} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Rent (₹)</Label>
              <Input type="number" min={0} value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} placeholder="0" className="h-10 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Rent For Month</Label>
              <Select value={rentForMonth} onValueChange={setRentForMonth}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Year</Label>
              <Select value={rentForYear} onValueChange={setRentForYear}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Transaction ID (optional)</Label>
            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="TXN123456" className="h-10 rounded-xl" />
          </div>

          {formError && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Allocated: ₹{Number(depositAmount || 0) + Number(rentAmount || 0)} / ₹{Number(amount || 0)}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="rounded-full flex-1 border-slate-200">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting} className="rounded-full flex-1 bg-teal-600 hover:bg-teal-700 text-white">
              {submitting ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </div>
      )}

      {/* Payment List */}
      {guest.payments.length === 0 ? (
        <EmptyState icon={Receipt} title="No payment records" subtitle="This guest has no payment records yet." />
      ) : (
        guest.payments.map((p) => (
          <div key={p.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{p.type}</span>
                <Badge variant="outline" className={`rounded-full text-[10px] font-medium ${PAYMENT_STATUS_COLORS[p.status] || "bg-slate-100 text-slate-600"}`}>
                  {p.status}
                </Badge>
              </div>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(p.amount)}</span>
            </div>

            {/* Split breakdown */}
            {(p.depositAmount || p.rentAmount) && (
              <div className="flex flex-wrap gap-2 mb-2">
                {p.depositAmount ? (
                  <Badge variant="outline" className="rounded-full text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                    Deposit: {formatCurrency(p.depositAmount)}
                  </Badge>
                ) : null}
                {p.rentAmount ? (
                  <Badge variant="outline" className="rounded-full text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">
                    Rent: {formatCurrency(p.rentAmount)}
                    {p.rentForMonth && p.rentForYear ? ` (${MONTH_OPTIONS.find(m => m.value === p.rentForMonth)?.label || ""} ${p.rentForYear})` : ""}
                  </Badge>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
              <span>Method: {p.method}</span>
              <span>Date: {formatDate(p.createdAt)}</span>
              {p.transactionId && <span className="sm:col-span-2">Txn ID: {p.transactionId}</span>}
            </div>
            {p.proofImages && p.proofImages.length > 0 && (
              <div className="flex gap-2 mt-3">
                {p.proofImages.map((img, i) => (
                  <button key={i} onClick={() => onViewImage(img)} className="relative group">
                    <img src={img} alt={`Proof ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Eye className="h-3 w-3 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
