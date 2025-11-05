import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";
import axios from "axios";

// Match enum PaymentMethod in your Prisma schema
const paymentMethods = [
  { key: "CASH", label: "Cash" },
  { key: "CARD", label: "Card" },
  { key: "AIRTEL_MONEY", label: "Airtel Money" },
  { key: "MPESA", label: "M-Pesa" },
  { key: "ORANGE_MONEY", label: "Orange Money" },
  { key: "AFRI_MONEY", label: "Afri Money" },
];

const CloseDay = ({ isOpen, onClose, onSuccess }) => {
  const [declaredAmounts, setDeclaredAmounts] = useState({});
  const [declaredExpenses, setDeclaredExpense] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState(null);

  const handleAmountChange = (methodKey, value) => {
    setDeclaredAmounts((prev) => ({
      ...prev,
      [methodKey]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async () => {
    setError("");

    if (!date) {
      setError("Please select a date.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `/api/repports/close/${date}`,
        {
          declaredAmounts,
          declaredExpenses,
          notes,
        },
        { withCredentials: true }
      );

      toast.success(response.data.message || "Day closed successfully.");

      onSuccess?.(response.data.report);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while closing the day."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Close the Day
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Please select the date and declare the collected amounts.
          </p>
        </DialogHeader>

        {/* Date Picker */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Date to close
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Declared amounts by method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentMethods.map(({ key, label }) => (
              <div key={key} className="flex flex-col">
                <label className="text-sm font-medium mb-1">{label}</label>
                <input
                  type="number"
                  className="border border-gray-300 rounded-lg px-3 py-2 shadow-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={declaredAmounts[key] || ""}
                  onChange={(e) => handleAmountChange(key, e.target.value)}
                  placeholder="Declared amount"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Depenses</label>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 shadow-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={declaredExpenses}
            type="number"
            onChange={(e) => setDeclaredExpense(e.target.value)}
            placeholder="Depenses"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (optional)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes or comments"
          />
        </div>

        {/* Error message */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Footer Buttons */}
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Closing..." : "Close Day"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseDay;

// TODO: Add if a signed bill was paid onthe close date
