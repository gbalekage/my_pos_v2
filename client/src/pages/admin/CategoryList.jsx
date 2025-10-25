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

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editCategory, setEditCategory] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/categories/", { withCredentials: true });
      setCategories(res.data.categories);
    } catch (error) {
      console.error("Error getting categories:", error);
      toast.error("Error getting categories, try again later");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Edit handlers
  const handleEditClick = (category) => {
    setEditCategory({ ...category });
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditCategory((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmEdit = async () => {
    if (!editCategory?.id) return;
    setEditLoading(true);
    try {
      const res = await axios.put(
        `/api/categories/${editCategory.id}`,
        {
          name: editCategory.name,
          description: editCategory.description,
        },
        { withCredentials: true }
      );

      setCategories((prev) =>
        prev.map((cat) => (cat.id === editCategory.id ? res.data.category : cat))
      );

      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category, please try again later");
    } finally {
      setEditCategory(null);
      setIsEditDialogOpen(false);
      setEditLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (categoryId) => {
    setDeleteCategoryId(categoryId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCategoryId) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/categories/${deleteCategoryId}`, {
        withCredentials: true,
      });
      setCategories((prev) =>
        prev.filter((cat) => cat.id !== deleteCategoryId)
      );
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setDeleteCategoryId(null);
      setIsDeleteDialogOpen(false);
      setDeleteLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-muted-foreground flex justify-center items-center">
          <Loader className="animate-spin size-5" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pl-6">
        <h1 className="text-xl font-semibold mb-4">Category List</h1>

        {categories.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No categories found
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
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.description || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(category)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(category.id)}
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
              Are you sure you want to delete this category? This action cannot
              be undone.
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
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>

            {editCategory && (
              <div className="space-y-4 mt-2">
                <Input
                  value={editCategory.name}
                  onChange={(e) =>
                    handleEditChange("name", e.target.value)
                  }
                  placeholder="Name"
                />
                <Input
                  value={editCategory.description || ""}
                  onChange={(e) =>
                    handleEditChange("description", e.target.value)
                  }
                  placeholder="Description"
                />
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

export default CategoryList;
