import AdminLayout from "@/components/admin/AdminLayout";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import {
  Table as UiTable,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [groupBy, setGroupBy] = useState("all");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/sales", { withCredentials: true });
      setSales(res.data.sales || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des ventes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filter by date if provided
  const filteredSales = filterDate
    ? sales.filter(
        (s) => new Date(s.createdAt).toISOString().split("T")[0] === filterDate
      )
    : sales;

  // Grouping helper
  const groupSales = (salesList) => {
    const groups = {};

    if (groupBy === "all") {
      const total = salesList.reduce((acc, s) => acc + s.totalAmount, 0);
      return { "Total Ventes": { total, sales: salesList } };
    }

    salesList.forEach((s) => {
      switch (groupBy) {
        case "attendant": {
          const key = s.attendant.name;
          if (!groups[key]) groups[key] = { total: 0, sales: [] };
          groups[key].total += s.totalAmount;
          groups[key].sales.push(s);
          break;
        }
        case "store": {
          s.items.forEach((i) => {
            const storeName = i.item.store?.name || "Unknown Store";
            if (!groups[storeName]) groups[storeName] = { total: 0, sales: [] };
            groups[storeName].total += i.price * i.quantity;
            groups[storeName].sales.push(s);
          });
          break;
        }
        case "item": {
          s.items.forEach((i) => {
            const itemName = i.item.name;
            if (!groups[itemName]) groups[itemName] = { total: 0, sales: [] };
            groups[itemName].total += i.price * i.quantity;
            groups[itemName].sales.push(s);
          });
          break;
        }
        default:
          break;
      }
    });

    return groups;
  };

  const grouped = groupSales(filteredSales);

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Tableau des Ventes</h1>

        <div className="flex gap-4 mb-4 items-center">
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <select
            className="p-2 border rounded"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option value="all">Tout</option>
            <option value="attendant">Par Attendant</option>
            <option value="store">Par Magasin</option>
            <option value="item">Par Article</option>
          </select>
          <Button onClick={fetchSales}>Rafraîchir</Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin w-8 h-8" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-gray-500 text-center">Aucune vente trouvée.</p>
        ) : (
          Object.entries(grouped).map(([groupName, data]) => (
            <div key={groupName} className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                {groupName} - Total: {data.total.toFixed(2)} FC
              </h2>
              <UiTable>
                <TableHeader>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Numéro Vente</TableCell>
                    <TableCell>Attendant</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        {new Date(s.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{s.orderNumber || s.id}</TableCell>
                      <TableCell>{s.attendant.name}</TableCell>
                      <TableCell>{s.table?.number || "-"}</TableCell>
                      <TableCell>{s.totalAmount.toFixed(2)} FC</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </UiTable>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default Sales;
