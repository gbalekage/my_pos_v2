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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Cancelations = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    item: "",
    date: "",
  });

  const fetchActiveOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/cancellations", {
        withCredentials: true,
      });
      const data = res.data.cancellations || [];
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des annulations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  // Handle filtering
  useEffect(() => {
    let filtered = orders;

    if (filters.item.trim() !== "") {
      filtered = filtered.filter((o) =>
        o.name.toLowerCase().includes(filters.item.toLowerCase())
      );
    }

    if (filters.date !== "") {
      const selectedDate = new Date(filters.date).toDateString();
      filtered = filtered.filter(
        (o) => new Date(o.cancelledAt).toDateString() === selectedDate
      );
    }

    setFilteredOrders(filtered);
  }, [filters, orders]);

  return (
    <AdminLayout>
      <div className="p-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold">Annulations</h1>
          <Button variant="outline" onClick={fetchActiveOrders}>
            Rafraîchir
          </Button>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Input
              placeholder="Filtrer par article..."
              value={filters.item}
              onChange={(e) =>
                setFilters({ ...filters, item: e.target.value })
              }
            />
          </div>
          <div>
            <Input
              type="date"
              value={filters.date}
              onChange={(e) =>
                setFilters({ ...filters, date: e.target.value })
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin size-4" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-muted-foreground text-center">
            Aucune annulation trouvée.
          </p>
        ) : (
          <UiTable>
            <TableHeader>
              <TableRow>
                <TableCell>Article</TableCell>
                <TableCell>Qté</TableCell>
                <TableCell>PU</TableCell>
                <TableCell>PT</TableCell>
                <TableCell>Annulé par</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.name}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    {order.unitPrice?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>
                    {order.totalPrice?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>{order.user?.name || "—"}</TableCell>
                  <TableCell>
                    {new Date(order.cancelledAt).toLocaleString("fr-FR") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </UiTable>
        )}
      </div>
    </AdminLayout>
  );
};

export default Cancelations;
