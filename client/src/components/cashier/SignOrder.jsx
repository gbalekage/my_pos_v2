import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

const SignOrderModal = ({
  isOpen,
  onClose,
  orderId,
  customers = [],
  onSuccess,
}) => {
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId("");
    }
  }, [isOpen]);

  const handleSignOrder = () => {
    if (!selectedClientId) {
      toast.error("Please select a customer.");
      return;
    }

    // Placeholder for signing logic
    // Replace with your custom handler (e.g., context, local API, etc.)
    console.log(`Order #${orderId} signed for customer ID: ${selectedClientId}`);

    toast.success("Order signed successfully.");
    onSuccess?.();
    onClose();
  };

  if (!orderId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Order #{orderId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-700">
            Please select a customer for this signed invoice:
          </p>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.fullName}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-gray-500 text-sm">
                  No customers available.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSignOrder} disabled={!selectedClientId}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignOrderModal;


// TODO: api calls for the cashoer, expenses controller, close day logic, etc.