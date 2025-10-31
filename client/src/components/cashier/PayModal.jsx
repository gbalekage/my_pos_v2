import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import axios from "axios";

// ✅ Match backend enum values (Prisma)
const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "AFRI_MONEY", label: "Afri Money" },
  { value: "MPESA", label: "M-Pesa" },
];

const PayOrderModal = ({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  onPaymentSuccess,
  setPayModalOpen,
}) => {
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [amountReceived, setAmountReceived] = useState("");
  const [change, setChange] = useState(0);
  const [loading, setLoading] = useState(false);
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmountReceived("");
      setChange(0);
      setPaymentMethod(paymentMethods[0].value);
    }
  }, [isOpen]);

  // Calculate change to return
  useEffect(() => {
    const received = parseFloat(amountReceived);
    setChange(!isNaN(received) ? received - totalAmount : 0);
  }, [amountReceived, totalAmount]);

  const handleConfirmPayment = async () => {

  };

  if (!orderId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment for Order #{orderId}</DialogTitle>
          <DialogDescription>
            Please verify the received amount before confirming the payment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Payment method */}
          <div>
            <label className="block font-semibold mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Total amount */}
          <div>
            <label className="block font-semibold mb-1">Total Amount</label>
            <input
              type="text"
              readOnly
              value={totalAmount.toLocaleString("en-US")}
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>

          {/* Amount received */}
          <div>
            <label className="block font-semibold mb-1">Amount Received</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter received amount"
              disabled={loading}
            />
          </div>

          {/* Change to return */}
          <div>
            <label className="block font-semibold mb-1">Change to Return</label>
            <input
              type="text"
              readOnly
              value={change >= 0 ? change.toFixed(2).toLocaleString("en-US") : "-"}
              className={`w-full p-2 border rounded bg-gray-100 ${
                change < 0 ? "text-red-600 font-bold" : ""
              }`}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmPayment} disabled={loading || change < 0}>
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayOrderModal;
