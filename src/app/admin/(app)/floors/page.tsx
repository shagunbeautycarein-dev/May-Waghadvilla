"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Building } from "lucide-react";

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

type Floor = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: { rooms: number };
};

const floorFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  sortOrder: z.number().int().min(0),
});

type FloorFormValues = z.infer<typeof floorFormSchema>;

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

  const form = useForm<FloorFormValues>({
    resolver: zodResolver(floorFormSchema),
    defaultValues: { name: "", sortOrder: 0 },
  });

  const fetchFloors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/floors");
      if (!res.ok) throw new Error("Failed to fetch floors");
      const data: Floor[] = await res.json();
      setFloors(data);
    } catch {
      toast.error("Failed to fetch floors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  const onSubmit = async (values: FloorFormValues) => {
    try {
      const res = await fetch("/api/admin/floors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create floor");
        return;
      }
      toast.success("Floor created successfully");
      setIsAddOpen(false);
      form.reset({ name: "", sortOrder: 0 });
      fetchFloors();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onEdit = async (values: FloorFormValues) => {
    if (!selectedFloor) return;
    try {
      const res = await fetch("/api/admin/floors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedFloor.id, ...values }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update floor");
        return;
      }
      toast.success("Floor updated successfully");
      setIsEditOpen(false);
      setSelectedFloor(null);
      fetchFloors();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onDelete = async () => {
    if (!selectedFloor) return;
    try {
      const res = await fetch(`/api/admin/floors?id=${selectedFloor.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to delete floor");
        return;
      }
      toast.success("Floor deleted successfully");
      setIsDeleteOpen(false);
      setSelectedFloor(null);
      fetchFloors();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const openEdit = (floor: Floor) => {
    setSelectedFloor(floor);
    form.reset({ name: floor.name, sortOrder: floor.sortOrder });
    setIsEditOpen(true);
  };

  const openDelete = (floor: Floor) => {
    setSelectedFloor(floor);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Floors</h1>
        <Button
          onClick={() => {
            form.reset({ name: "", sortOrder: 0 });
            setIsAddOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Floor
        </Button>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <DataTableSkeleton columns={4} />
        ) : floors.length === 0 ? (
          <EmptyState
            icon={Building}
            title="No floors found"
            subtitle="Floors will appear here once you add them."
          />
        ) : (
          <div className="overflow-x-auto">

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {floors.map((floor) => (
                <TableRow key={floor.id}>
                  <TableCell>{floor.name}</TableCell>
                  <TableCell>{floor.sortOrder}</TableCell>
                  <TableCell>{floor._count.rooms}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(floor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit floor</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openDelete(floor)}
                            disabled={floor._count.rooms > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete floor</TooltipContent>
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
            <DialogTitle>Add Floor</DialogTitle>
            <DialogDescription>Create a new floor.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Floor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
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
            <DialogTitle>Edit Floor</DialogTitle>
            <DialogDescription>Update floor details.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Floor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
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
            <AlertDialogTitle>Delete Floor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedFloor?.name}</strong>?
              {selectedFloor && selectedFloor._count.rooms > 0 && (
                <span className="mt-2 block text-red-600">
                  This floor has rooms and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={!!selectedFloor && selectedFloor._count.rooms > 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
