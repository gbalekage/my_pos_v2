import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SignedBillsModal = ({ open, onClose, signedBills, formatCurrency }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Today Signed Bills</DialogTitle>
        </DialogHeader>

        {signedBills?.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Order ID</th>
                  <th className="p-2 text-left">Attendant</th>
                  <th className="p-2 text-left">Client</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {signedBills.map((bill, index) => (
                  <tr key={bill.id} className="border-b hover:bg-muted/40">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{bill.orderId}</td>
                    <td className="p-2">{bill.attendant?.name || "—"}</td>
                    <td className="p-2">{bill.client?.name || "—"}</td>
                    <td className="p-2">
                      {new Date(bill.createdAt).toLocaleString("fr-CD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">
            No signed bills found for today.
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

export default SignedBillsModal;
