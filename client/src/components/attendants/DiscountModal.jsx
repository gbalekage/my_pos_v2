import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";
import axios from "axios";
import { Loader } from "lucide-react";
import AdminVerifyModal from "../main/AdminVerifyModal";

const DiscountModal = ({ open, onclose, order, fetchTables }) => {
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const discountOptions = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const applyDiscount = async () => {
    if (!selectedDiscount) {
      toast.error("Please select a discount percentage.");
      return;
    }
    // Open the admin verification modal
    setVerifyOpen(true);
  };

  // Called when admin is verified
  const onAdminVerified = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `/api/orders/${order.id}/discount`,
        { discountPercentage: selectedDiscount },
        { withCredentials: true }
      );

      toast.success(response.data.message);
      await fetchTables();
      onclose();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Error while applying the discount."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onclose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Select a discount percentage and verify admin to proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-2 my-4">
            {discountOptions.map((percent) => (
              <Button
                key={percent}
                variant={selectedDiscount === percent ? "default" : "outline"}
                onClick={() => setSelectedDiscount(percent)}
              >
                {percent}%
              </Button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onclose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={applyDiscount} disabled={loading}>
              {loading ? <Loader className="animate-spin w-4 h-4" /> : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin verification popup */}
      <AdminVerifyModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onSuccess={onAdminVerified}
      />
    </>
  );
};

export default DiscountModal;
