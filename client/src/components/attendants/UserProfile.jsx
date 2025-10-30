import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import axios from "axios";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useNavigate } from "react-router-dom";

const UserProfile = ({ open, onClose, user }) => {
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const clearUser = useUserStore((state) => state.clearUser);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["name", "username"].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setPasswordForm((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await axios.put("/api/users/password", passwordForm, {
        withCredentials: true,
      });
      toast.success(res.data.message || "Password updated successfully.");

      setPasswordForm({
        password: "",
        newPassword: "",
        confirmPassword: "",
      });
      clearUser();
      navigate("/");
      toast.info("Please log in again with your new password.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to update password."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6 space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Update Your Password
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            For security reasons, please update your password regularly.
          </DialogDescription>
        </DialogHeader>

        {/* Password Section */}
        <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
          <h3 className="font-medium text-lg">Change Password</h3>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={passwordForm.password}
                onChange={handleChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handlePasswordUpdate}
              disabled={isUpdatingPassword}
              variant="secondary"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader className="size-4 animate-spin" />
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
