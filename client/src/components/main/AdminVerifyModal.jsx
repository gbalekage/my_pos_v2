import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import axios from "axios";
import { Loader } from "lucide-react";

const AdminVerifyModal = ({ open, onClose, onSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyAdmin = async () => {
    if (!username || !password) {
      toast.error("Please enter admin credentials.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `/api/users/verify-admin`,
        { username, password },
        { withCredentials: true }
      );

      if (response.data?.success) {
        onSuccess();
        onClose();
      } else {
        toast.error("Invalid admin credentials");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Error verifying admin credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Admin Verification</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 my-4">
          <Input
            placeholder="Admin username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={verifyAdmin} disabled={loading}>
            {loading ? <Loader className="animate-spin w-4 h-4" /> : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminVerifyModal;
