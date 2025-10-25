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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editItem, setEditItem] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteItemId, setDeleteItemId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch items, stores, categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, storesRes, categoriesRes] = await Promise.all([
        axios.get("/api/items", { withCredentials: true }),
        axios.get("/api/stores", { withCredentials: true }),
        axios.get("/api/categories", { withCredentials: true }),
      ]);
      setItems(itemsRes.data.items);
      setStores(storesRes.data.stores);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Edit handlers
  const handleEditClick = (item) => {
    setEditItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmEdit = async () => {
    if (!editItem?.id) return;
    setEditLoading(true);
    try {
      const res = await axios.put(`/api/items/${editItem.id}`, editItem, { withCredentials: true });
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? res.data.item : i)));
      toast.success("Item updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update item");
    } finally {
      setEditLoading(false);
      setIsEditDialogOpen(false);
      setEditItem(null);
    }
  };

  // Delete handlers
  const handleDeleteClick = (itemId) => {
    setDeleteItemId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/items/${deleteItemId}`, { withCredentials: true });
      setItems((prev) => prev.filter((i) => i.id !== deleteItemId));
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item");
    } finally {
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center p-6">
        <Loader className="animate-spin size-5" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="pl-6">
        <h1 className="text-xl font-semibold mb-4">Item List</h1>

        {items.length === 0 ? (
          <div className="text-center text-muted-foreground">No items found</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.store?.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.category?.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.package || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(item)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(item.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-4 mt-2">
                <Input value={editItem.name} onChange={(e) => handleEditChange("name", e.target.value)} placeholder="Item Name" />
                <Select value={editItem.storeId} onValueChange={(v) => handleEditChange("storeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Store" /></SelectTrigger>
                  <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={editItem.categoryId} onValueChange={(v) => handleEditChange("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" value={editItem.stock} onChange={(e) => handleEditChange("stock", parseInt(e.target.value))} placeholder="Stock" />
                <Input type="text" value={editItem.barcode} onChange={(e) => handleEditChange("barcode", e.target.value)} placeholder="Barcode" />
                <Input type="number" value={editItem.price} onChange={(e) => handleEditChange("price", parseFloat(e.target.value))} placeholder="Price" />
                <Input value={editItem.package || ""} onChange={(e) => handleEditChange("package", e.target.value)} placeholder="Package" />
              </div>
            )}
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button variant="default" onClick={handleConfirmEdit}>
                {editLoading ? <Loader className="animate-spin size-4" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p>This action cannot be undone.</p>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {deleteLoading ? <Loader className="animate-spin size-4" /> : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ItemList;
