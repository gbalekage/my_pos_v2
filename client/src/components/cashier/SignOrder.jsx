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
import axios from "axios";
import { Loader } from "lucide-react";

const SignOrderModal = ({ isOpen, onClose, orderId, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("/api/clients/");
      setCustomers(res.data.clients);
      console.log("Response in get Client", res.data);
    } catch (error) {
      console.log("Error in get customer", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId("");
      fetchCustomers();
    }
  }, [isOpen]);

  const handleSignOrder = async () => {
    if (!selectedClientId) {
      toast.error("Please select a customer.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `/api/orders/sign/${orderId}/${selectedClientId}`,
        {},
        {
          withCredentials: true,
        }
      );

      console.log("Signed Bill Response:", res.data);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.log("error in sign bill", error);
      toast.error(error.response.data.message || "Error in sign bill");
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Order #{orderId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Please select a customer for this signed invoice:
          </p>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-muted-foreground text-sm">
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
          <Button
            onClick={handleSignOrder}
            disabled={!selectedClientId || loading}
          >
            {loading ? <Loader className="animate-spin size-4" /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignOrderModal;

// TODO: api calls for the cashoer, expenses controller, close day logic, etc.
