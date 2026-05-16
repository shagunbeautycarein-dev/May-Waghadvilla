"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, BedDouble } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { BED_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type Room = { id: string; name: string };
type Bed = {
  id: string;
  roomId: string;
  name: string;
  rent: number;
  deposit: number;
  status: string;
  currentGuest: { name: string; email: string } | null;
  room: Room;
};

const bedFormSchema = z.object({
  roomId: z.string().uuid("Select a room"),
  name: z.string().min(1, "Name is required").max(10),
  rent: z.number().positive("Rent must be positive"),
  deposit: z.number().positive("Deposit must be positive"),
});

type BedFormValues = z.infer<typeof bedFormSchema>;

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedFormSchema),
    defaultValues: { roomId: "", name: "", rent: 0, deposit: 0 },
  });

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = (await res.json()) as Array<Bed["room"] & { floor?: { name: string } }>;
      setRooms(data.map((r) => ({ id: r.id, name: r.name })));
    } catch {
      toast.error("Failed to fetch rooms");
    }
  };

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRoomId) params.append("roomId", selectedRoomId);
      if (selectedStatus) params.append("status", selectedStatus);
      const res = await fetch(`/api/admin/beds?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch beds");
      const data: Bed[] = await res.json();
      setBeds(data);
    } catch {
      toast.error("Failed to fetch beds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchBeds();
  }, [selectedRoomId, selectedStatus]);

  const onSubmit = async (values: BedFormValues) => {
    try {
      const res = await fetch("/api/admin/beds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create bed");
        return;
      }
      toast.success("Bed created successfully");
      setIsAddOpen(false);
      form.reset({ roomId: "", name: "", rent: 0, deposit: 0 });
      fetchBeds();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onEdit = async (values: BedFormValues) => {
    if (!selectedBed) return;
    try {
      const res = await fetch("/api/admin/beds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedBed.id, rent: values.rent, deposit: values.deposit }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update bed");
        return;
      }
      toast.success("Bed updated successfully");
      setIsEditOpen(false);
      setSelectedBed(null);
      fetchBeds();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onDelete = async () => {
    if (!selectedBed) return;
    try {
      const res = await fetch(`/api/admin/beds?id=${selectedBed.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to delete bed");
        return;
      }
      toast.success("Bed deleted successfully");
      setIsDeleteOpen(false);
      setSelectedBed(null);
      fetchBeds();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const openEdit = (bed: Bed) => {
    setSelectedBed(bed);
    form.reset({
      roomId: bed.roomId,
      name: bed.name,
      rent: bed.rent,
      deposit: bed.deposit,
    });
    setIsEditOpen(true);
  };

  const openDelete = (bed: Bed) => {
    setSelectedBed(bed);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Beds</h1>
        <Button
          onClick={() => {
            form.reset({ roomId: "", name: "", rent: 0, deposit: 0 });
            setIsAddOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Bed
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          value={selectedRoomId || "all"}
          onValueChange={(v) => setSelectedRoomId(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus || "all"}
          onValueChange={(v) => setSelectedStatus(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {BED_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <DataTableSkeleton columns={7} />
        ) : beds.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="No beds found"
            subtitle="Beds will appear here once you add them."
          />
        ) : (
          <div className="overflow-x-auto">

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bed Name</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Rent (₹)</TableHead>
                <TableHead>Deposit (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beds.map((bed) => (
                <TableRow key={bed.id}>
                  <TableCell>{bed.name}</TableCell>
                  <TableCell>{bed.room.name}</TableCell>
                  <TableCell>{formatCurrency(bed.rent)}</TableCell>
                  <TableCell>{formatCurrency(bed.deposit)}</TableCell>
                  <TableCell>
                    <StatusBadge status={bed.status} type="bed" />
                  </TableCell>
                  <TableCell>{bed.currentGuest?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(bed)}
                            disabled={bed.status !== "Available"}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit bed</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openDelete(bed)}
                            disabled={bed.status !== "Available"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete bed</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bed</DialogTitle>
            <DialogDescription>Create a new bed.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. A1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rent (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bed</DialogTitle>
            <DialogDescription>Update bed rent and deposit.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. A1" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rent (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete bed{" "}
              <strong>{selectedBed?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
