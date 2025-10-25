import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useUserStore();

  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true });
      const filteredUsers = (res.data.users || []).filter(
        (u) => u.id !== currentUser?.id
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
      toast.error("Server error, please try again");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser?.id]);

  // --- Edit User ---
  const handleEditClick = (user) => {
    setEditUser(user);
    setPassword("");
    setConfirmPassword("");
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditUser({ ...editUser, [field]: value });
  };

  const handleConfirmEdit = async () => {
    if (!editUser?.id) return;
    setEditLoading(true);

    try {
      const res = await axios.put(
        `/api/users/update-user/${editUser.id}`,
        {
          name: editUser.name,
          email: editUser.email,
          role: editUser.role,
          isActive: editUser.isActive,
          suspended: editUser.suspended,
        },
        { withCredentials: true }
      );

      toast.success("User updated successfully");
      setUsers(users.map((u) => (u.id === editUser.id ? res.data.user : u)));
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setEditUser(null);
      setIsEditDialogOpen(false);
      setEditLoading(false);
    }
  };

  // --- Update Password ---
  const handleUpdatePassword = async () => {
    if (!password) return toast.error("Password cannot be empty");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setPasswordLoading(true);
    try {
      await axios.put(
        `/api/users/password/${editUser.id}`,
        { password },
        { withCredentials: true }
      );

      toast.success("Password updated successfully");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- Delete User ---
  const handleDeleteClick = (userId) => {
    setDeleteUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;
    setDeleteLoading(true);

    try {
      await axios.delete(`/api/users/delete/${deleteUserId}`, { withCredentials: true });
      toast.success("User deleted successfully");
      setUsers(users.filter((u) => u.id !== deleteUserId));
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeleteUserId(null);
      setIsDeleteDialogOpen(false);
      setDeleteLoading(false);
    }
  };

  // --- UI ---
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
        <h1 className="text-xl font-semibold mb-4">Users List</h1>

        {users.length === 0 ? (
          <div className="text-center text-muted-foreground">No users found</div>
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
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isActive && !user.suspended
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive && !user.suspended ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(user.id)}
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

        {/* --- Delete Confirmation Dialog --- */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this user? This action cannot be undone.</p>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {deleteLoading ? <Loader className="animate-spin size-4" /> : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- Edit User Dialog --- */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>

            {editUser && (
              <div className="space-y-4 mt-2">
                <Input
                  value={editUser.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  placeholder="Name"
                />
                <Input
                  value={editUser.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  placeholder="Email"
                />

                <Select
                  value={editUser.role}
                  onValueChange={(val) => handleEditChange("role", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="ATTENDANT">ATTENDANT</SelectItem>
                    <SelectItem value="CASHIER">CASHIER</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-4">
                  <span>Active:</span>
                  <Switch
                    checked={editUser.isActive}
                    onCheckedChange={(val) => handleEditChange("isActive", val)}
                  />
                  <span>Suspended:</span>
                  <Switch
                    checked={editUser.suspended}
                    onCheckedChange={(val) => handleEditChange("suspended", val)}
                  />
                </div>

                {/* --- Password Section --- */}
                <div className="flex flex-col gap-2 mt-2">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                  />
                  <Button variant="link" onClick={handleUpdatePassword}>
                    {passwordLoading ? (
                      <Loader className="animate-spin size-4" />
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleConfirmEdit}>
                {editLoading ? <Loader className="animate-spin size-4" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UsersList;
