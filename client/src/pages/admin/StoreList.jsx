import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deleteStoreId, setDeleteStoreId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editStore, setEditStore] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch all stores
  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/stores/");
      setStores(res.data.stores);
    } catch (error) {
      console.error("Error getting stores", error);
      toast.error("Error getting stores, try again");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all printers
  const fetchPrinters = async () => {
    try {
      const res = await axios.get("/api/printers");
      setPrinters(res.data.printers || []);
    } catch (error) {
      console.error("Error fetching printers:", error);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchPrinters();
  }, []);

  const handleEditClick = (store) => {
    setEditStore(store);
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditStore({ ...editStore, [field]: value });
  };

  const handleConfirmEdit = async () => {
    if (!editStore?.id) return;
    setEditLoading(true);
    try {
      const res = await axios.put(
        `/api/stores/${editStore.id}`,
        {
          name: editStore.name,
          printerId: editStore.printerId,
          isActive: editStore.isActive,
        },
        { withCredentials: true }
      );

      setStores(
        stores.map((s) => (s.id === editStore.id ? res.data.store : s))
      );

      toast.success("Store updated successfully");
    } catch (error) {
      console.error("Error updating store:", error);
      toast.error("Failed to update store, please try again");
    } finally {
      setEditStore(null);
      setIsEditDialogOpen(false);
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (storeId) => {
    setDeleteStoreId(storeId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteStoreId) return;
    setDeleteLoading(true);

    try {
      await axios.delete(`/api/stores/${deleteStoreId}`, {
        withCredentials: true,
      });
      setStores(stores.filter((p) => p.id !== deleteStoreId));
      toast.success("Store deleted successfully");
    } catch (error) {
      console.error("Error deleting store:", error);
      toast.error("Failed to delete the store");
    } finally {
      setDeleteStoreId(null);
      setIsDeleteDialogOpen(false);
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-muted-foreground flex justify-center items-center">
          <Loader className="animate-spin size-4" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pl-6">
        <h1 className="text-xl font-semibold mb-4">Stores List</h1>

        {stores.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No stores found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full divide-y">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Printer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{store.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {store.printer?.name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          store.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {store.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(store)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(store.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to delete this store? This action cannot be
              undone.
            </p>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {deleteLoading ? (
                  <Loader className="animate-spin size-4" />
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Store</DialogTitle>
            </DialogHeader>

            {editStore && (
              <div className="space-y-4 mt-2">
                <Input
                  value={editStore.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  placeholder="Store name"
                />

                {/* Printer Selection Dropdown */}
                <Select
                  value={editStore.printerId || ""}
                  onValueChange={(value) =>
                    handleEditChange("printerId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Printer" />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.map((printer) => (
                      <SelectItem key={printer.id} value={printer.id}>
                        {printer.name} ({printer.ipAddress})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-4">
                  <span>Active:</span>
                  <Switch
                    checked={editStore.isActive}
                    onCheckedChange={(val) =>
                      handleEditChange("isActive", val)
                    }
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="default" onClick={handleConfirmEdit}>
                {editLoading ? (
                  <Loader className="animate-spin size-4" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default StoreList;
