import axios from "axios";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "../ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";
import AdminVerifyModal from "../main/AdminVerifyModal";

const RemoveItems = ({ open, onclose, order, fetchTables, setTable }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const handleCheckboxChange = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Trigger admin verification
  const handleRemove = () => {
    if (selectedItems.length === 0) {
      toast.warning("Please select at least one item to remove");
      return;
    }
    setVerifyOpen(true); // open admin verification modal
  };

  // Called after admin is verified
  const onAdminVerified = async () => {
    setLoading(true);
    try {
      const itemsToCancel = selectedItems.map((itemId) => {
        const item = order.items.find((oi) => oi.id === itemId);
        return {
          itemId: item.itemId,
          quantity: item.quantity,
        };
      });

      await axios.delete(`/api/orders/remove-item/${order.id}`, {
        data: { itemsToCancel },
        withCredentials: true,
      });

      toast.success("Selected items removed successfully");
      fetchTables();
      onclose();
setTable(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to remove items");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onclose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Items from Order</DialogTitle>
          </DialogHeader>

          {order?.items?.length > 0 ? (
            <div className="space-y-3 min-h-64 overflow-y-auto">
              {order.items.map((orderItem) => (
                <div
                  key={orderItem.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedItems.includes(orderItem.id)}
                      onCheckedChange={() => handleCheckboxChange(orderItem.id)}
                    />
                    <p className="text-xs font-medium">{orderItem.item.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {orderItem.quantity} X {orderItem.item.price.toFixed(2)} FC
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No items to remove</p>
          )}

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onclose}>
              Cancel
            </Button>
            <Button
              disabled={loading || selectedItems.length === 0}
              onClick={handleRemove}
            >
              {loading ? <Loader className="animate-spin w-4 h-4" /> : "Remove"}
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

export default RemoveItems;
