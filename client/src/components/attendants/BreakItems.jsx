import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import axios from "axios";
import AdminVerifyModal from "../main/AdminVerifyModal";

const BreakItemModal = ({ open, onClose, order, fetchTables, setTable }) => {
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [adminVerifyOpen, setAdminVerifyOpen] = useState(false);

  const handleSelectItem = (itemId, checked) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (!checked) delete updated[itemId];
      else updated[itemId] = 1; // default quantity
      return updated;
    });
  };

  const handleQuantityChange = (itemId, value, maxQuantity) => {
    const qty = Number(value);
    if (qty <= 0 || qty > maxQuantity) return;
    setSelectedItems((prev) => ({ ...prev, [itemId]: qty }));
  };

  // Called after admin verifies
  const onAdminVerified = async () => {
    setLoading(true);
    try {
      const payload = Object.entries(selectedItems).map(
        ([itemId, quantity]) => ({
          itemId,
          quantityToBreak: quantity,
        })
      );

      for (const item of payload) {
        await axios.post(`/api/orders/${order.id}/break-items`, item, {
          withCredentials: true,
        });
      }

      toast.success("Items successfully split!");
      setSelectedItems({});
      fetchTables();
      onClose();
      setTable(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error splitting items");
    } finally {
      setLoading(false);
      setAdminVerifyOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Break Items in Order</DialogTitle>
            <DialogDescription>
              Select items and quantity to break from the order.
            </DialogDescription>
          </DialogHeader>

          {order?.items?.length ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto border p-3 rounded-md">
              {order.items.map((i) => (
                <div
                  key={i.itemId || i.item.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        selectedItems[i.itemId || i.item.id] !== undefined
                      }
                      onCheckedChange={(checked) =>
                        handleSelectItem(i.itemId || i.item.id, checked)
                      }
                    />
                    <span className="font-medium">{i.item.name}</span>
                  </div>
                  {selectedItems[i.itemId || i.item.id] !== undefined && (
                    <Input
                      type="number"
                      min={1}
                      max={i.quantity}
                      value={selectedItems[i.itemId || i.item.id]}
                      onChange={(e) =>
                        handleQuantityChange(
                          i.itemId || i.item.id,
                          e.target.value,
                          i.quantity
                        )
                      }
                      className="w-20 text-right"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">No items found.</p>
          )}

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={() => setAdminVerifyOpen(true)}
              disabled={loading || Object.keys(selectedItems).length === 0}
            >
              {loading ? (
                <Loader className="animate-spin w-4 h-4" />
              ) : (
                "Break Items"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin verification before splitting */}
      <AdminVerifyModal
        open={adminVerifyOpen}
        onClose={() => setAdminVerifyOpen(false)}
        onSuccess={onAdminVerified}
      />
    </>
  );
};

export default BreakItemModal;
