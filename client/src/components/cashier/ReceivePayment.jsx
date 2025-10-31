import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "MPESA", label: "Mpesa" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "AFRI_MONEY", label: "Afri Money" },
];

const ReceivePayment = ({ isOpen, onClose, user, onSuccess, signedBills }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsDialog, setOrderDetailsDialog] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [receivedAmount, setReceivedAmount] = useState("");

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setOrderDetailsDialog(true);
  };

  const payClick = (order) => {
    setSelectedOrder(order);
    setPaymentMethod(paymentMethods[0].value);
    setReceivedAmount("");
    setPayModal(true);
  };

  const closeModals = () => {
    setSelectedOrder(null);
    setOrderDetailsDialog(false);
    setPayModal(false);
  };

  const handlePaymentConfirm = async () => {
    try {
      // TODO: integrate payment API here
      // Example: await axios.post(`/api/payments/${selectedOrder.id}`, { paymentMethod, receivedAmount })
      onSuccess && onSuccess();
      closeModals();
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  const calculateChange = () => {
    const amountNum = parseFloat(receivedAmount);
    if (!selectedOrder || isNaN(amountNum) || amountNum < selectedOrder.totalAmount)
      return 0;
    return amountNum - selectedOrder.totalAmount;
  };

  return (
    <>
      {/* Signed Bills List */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Pay a Client Debt</DialogTitle>
          </DialogHeader>
          <div className="max-h-[450px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Signed At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signedBills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No signed bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  signedBills.map((order, index) => (
                    <TableRow key={order.id} className="cursor-pointer">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{order.client.name}</TableCell>
                      <TableCell>
                        {order.totalAmount.toLocaleString()} FC
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button onClick={() => payClick(order)}>Pay</Button>
                        <Button
                          variant="link"
                          onClick={() => handleRowClick(order)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      <Dialog
        open={orderDetailsDialog}
        onOpenChange={() => setOrderDetailsDialog(false)}
      >
        <DialogContent className="max-w-xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Order Items</DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedOrder.items.map((i, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{i.item?.name || "Unknown"}</TableCell>
                    <TableCell>{i.quantity}</TableCell>
                    <TableCell>{i.price.toLocaleString()} FC</TableCell>
                    <TableCell>{i.total.toLocaleString()} FC</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No items to display.</p>
          )}
          <DialogFooter>
            <Button onClick={closeModals}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={payModal} onOpenChange={() => setPayModal(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Payment</DialogTitle>
            <DialogDescription>
              Please verify the received amount before confirming payment.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePaymentConfirm();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="paymentMethod" className="block font-medium">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    className="w-full border rounded p-2"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="receivedAmount" className="block font-medium">
                    Amount Received (FC)
                  </label>
                  <input
                    type="number"
                    id="receivedAmount"
                    min={selectedOrder.totalAmount}
                    step="0.01"
                    className="w-full border rounded p-2"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Total Due: {selectedOrder.totalAmount.toLocaleString()} FC
                  </p>
                  {receivedAmount &&
                    parseFloat(receivedAmount) >= selectedOrder.totalAmount && (
                      <p className="text-sm text-green-600 mt-1">
                        Change: {calculateChange().toLocaleString()} FC
                      </p>
                    )}
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Confirm</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReceivePayment;
