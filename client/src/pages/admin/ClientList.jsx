import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { Loader, PlusCircle } from "lucide-react";
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

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const [deleteClientId, setDeleteClientId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editClient, setEditClient] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Handle form changes for adding
  const handleChange = (field, value) => {
    setAddForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fetch clients from API
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/clients");
      setClients(res.data.clients || []);
      console.log("Clients data:", res.data.clients);
    } catch (error) {
      console.error("Error getting clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Handle form changes for editing
  const handleEditChange = (field, value) => {
    setEditClient((prev) => ({ ...prev, [field]: value }));
  };

  // Open edit dialog
  const handleEditClick = (client) => {
    setEditClient({ ...client });
    setIsEditDialogOpen(true);
  };

  // Confirm edit client
  const handleConfirmEdit = async () => {
    if (!editClient?.id) return;
    setEditLoading(true);
    try {
      const res = await axios.put(
        `/api/clients/${editClient.id}`,
        {
          name: editClient.name,
          email: editClient.email,
          phone: editClient.phone,
        },
        { withCredentials: true }
      );

      setClients((prev) =>
        prev.map((c) => (c.id === editClient.id ? res.data.client : c))
      );

      setIsEditDialogOpen(false);
      toast.success("Client information updated successfully.");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to update client. Please try again later."
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (clientId) => {
    setDeleteClientId(clientId);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteClientId) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/clients/${deleteClientId}`, {
        withCredentials: true,
      });

      setClients((prev) => prev.filter((c) => c.id !== deleteClientId));
      setIsDeleteDialogOpen(false);
      toast.success("Client deleted successfully.");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error(error.response?.data?.message || "Failed to delete client.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Add client
  const handleAddClient = async () => {
    setAdding(true);
    try {
      await axios.post(
        "/api/clients/create",
        {
          name: addForm.name,
          email: addForm.email,
          phone: addForm.phone,
        },
        { withCredentials: true }
      );

      setAddModal(false);
      fetchClients();
      toast.success("Client added successfully.");
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error(error.response?.data?.message || "Server error.");
    } finally {
      setAdding(false);
    }
  };

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
        {/* Header */}
        <div className="flex items-center justify-between pr-5">
          <h1 className="text-xl font-semibold m-4">Clients</h1>
          <PlusCircle
            className="cursor-pointer"
            onClick={() => setAddModal(true)}
          />
        </div>

        {/* Client Table */}
        {clients.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No clients found.
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.email || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.phone || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(client)}
                        disabled={editLoading || loading || deleteLoading}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(client.id)}
                        disabled={editLoading || loading || deleteLoading}
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
              Are you sure you want to delete this client? This action cannot be
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
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>

            {editClient && (
              <div className="space-y-4 mt-2">
                <Input
                  value={editClient.name || ""}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  placeholder="Name"
                />
                <Input
                  value={editClient.email || ""}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  placeholder="Email"
                />
                <Input
                  value={editClient.phone || ""}
                  onChange={(e) => handleEditChange("phone", e.target.value)}
                  placeholder="Phone"
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

        {/* Add Client Dialog */}
        <Dialog open={addModal} onOpenChange={setAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <Input
                value={addForm.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Name"
              />
              <Input
                value={addForm.email}
                type="email"
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email"
              />
              <Input
                value={addForm.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Phone"
              />
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleAddClient}>
                {adding ? (
                  <Loader className="animate-spin size-4" />
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ClientList;
