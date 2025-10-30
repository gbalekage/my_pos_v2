import AdminLayout from "@/components/admin/AdminLayout";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table as UiTable,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ActiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchActiveOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/orders/active"); // backend returns orders with status PENDING
      setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des commandes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Commandes Actives</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin size-4" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-center">
            Aucune commande active pour le moment.
          </p>
        ) : (
          <UiTable>
            <TableHeader>
              <TableRow>
                <TableCell>Table</TableCell>
                <TableCell>Numéro Commande</TableCell>
                <TableCell>Attendant</TableCell>
                <TableCell>Montant Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.Table?.number || "-"}</TableCell>
                  <TableCell>{order.orderNumber || order.id}</TableCell>
                  <TableCell>{order.attendant.name}</TableCell>
                  <TableCell>{order.totalAmount.toFixed(2)} FC</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Voir Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </UiTable>
        )}

        {/* Modal for order details */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Détails Commande #{selectedOrder.orderNumber || selectedOrder.id}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-2">
                <p>
                  <strong>Table:</strong> {selectedOrder.Table?.number || "-"}
                </p>
                <p>
                  <strong>Attendant:</strong> {selectedOrder.attendant.name}
                </p>
                <p>
                  <strong>Total:</strong> {selectedOrder.totalAmount.toFixed(2)} FC
                </p>

                <h3 className="mt-4 font-semibold">Articles</h3>
                <ul className="mt-2">
                  {selectedOrder.items.map((i) => (
                    <li key={i.id}>
                      {i.item.name} x{i.quantity} - {i.item.price.toFixed(2)} FC
                    </li>
                  ))}
                </ul>
              </div>

              <DialogFooter>
                <Button onClick={() => setSelectedOrder(null)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default ActiveOrders;
