import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";
import { toast } from "sonner";
import { Loader } from "lucide-react";

const AddExpenseModal = ({ isOpen, onClose, token, onSuccess }) => {
  const [branches, setBranches] = useState([]);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch available branches (stores)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get("/api/stores/");
        setBranches(res.data.stores);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to get branches");
      }
    };

    if (isOpen) {
      fetchBranches();
      setSelectedBranch("");
      setAmount("");
      setTitle("");
    }
  }, [isOpen, token]);

  // Add new expense
  const handleAdd = async () => {
    if (!selectedBranch || !title || !amount) {
      toast.error("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `/api/expenses/add-expense/${selectedBranch}`,
        {
          title,
          amount,
        },
        { withCredentials: true }
      );

      toast.success("Expense added successfully!");
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding the expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Title */}
          <div>
            <label className="block font-semibold mb-1">Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter expense title"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block font-semibold mb-1">Amount (FC)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter expense amount"
            />
          </div>

          {/* Branch selection */}
          <div>
            <label className="block font-semibold mb-1">Store / Branch</label>
            <Select
              value={selectedBranch}
              onValueChange={setSelectedBranch}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {branches.length === 0 ? (
                  <p className="text-center text-gray-500 p-2">
                    No stores available
                  </p>
                ) : (
                  branches.map((branch) => (
                    <SelectItem
                      key={branch.id || branch._id}
                      value={branch.id || branch._id}
                    >
                      {branch.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? <Loader className="animate-spin size-4" /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
