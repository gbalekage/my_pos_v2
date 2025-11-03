import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ExpensesModal = ({ open, onClose, expenses, formatCurrency }) => {

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Today Expenses</DialogTitle>
        </DialogHeader>

        {expenses?.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Created By</th>
                  <th className="p-2 text-left">Store</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, index) => (
                  <tr key={exp.id} className="border-b hover:bg-muted/40">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{formatCurrency(exp.amount)}</td>
                    <td className="p-2">{exp.user?.name || "—"}</td>
                    <td className="p-2">{exp.store?.name || "—"}</td>
                    <td className="p-2">
                      {new Date(exp.date).toLocaleString("fr-CD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">
            No expenses found for today.
          </p>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesModal;
