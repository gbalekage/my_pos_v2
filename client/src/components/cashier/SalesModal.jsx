import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SalesModal = ({ open, onClose, sales, formatCurrency }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Today’s Sales</DialogTitle>
        </DialogHeader>

        {sales?.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Table</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Payment</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={sale.id} className="border-b hover:bg-muted/40">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{sale.table?.name || "—"}</td>
                    <td className="p-2">{formatCurrency(sale.totalAmount)}</td>
                    <td className="p-2 capitalize">{sale.paymentMethod}</td>
                    <td className="p-2 capitalize">{sale.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">
            No sales found for today.
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

export default SalesModal;
