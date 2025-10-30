import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import AdminVerifyModal from "../main/AdminVerifyModal";

const SplitOrder = ({ open, onclose, order, fetchTables, setTable }) => {
  const [tables, setTables] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [newTableId, setNewTableId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // --- Fetch available tables ---
  useEffect(() => {
    const getTables = async () => {
      try {
        const { data } = await axios.get("/api/tables");
        const available = data.tables.filter((t) => t.status === "AVAILABLE");
        setTables(available);
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };
    if (open) getTables();
  }, [open]);

  // --- Handle checkbox + quantity ---
  const handleSelectItem = (itemId, checked) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (!checked) delete updated[itemId];
      else updated[itemId] = 1;
      return updated;
    });
  };

  const handleQuantityChange = (itemId, value) => {
    const qty = Number(value);
    if (qty <= 0) return;
    setSelectedItems((prev) => ({ ...prev, [itemId]: qty }));
  };

  // --- Trigger admin verification before split ---
  const handleSplitClick = () => {
    if (!newTableId) return toast.error("Veuillez choisir une table.");
    if (Object.keys(selectedItems).length === 0)
      return toast.error("Sélectionnez au moins un article.");
    setShowAdminModal(true);
  };

  // --- Actual split after admin verification ---
  const handleAdminSuccess = async () => {
    setShowAdminModal(false);
    setLoading(true);
    try {
      const payload = {
        newTableId,
        itemsToSplit: Object.entries(selectedItems).map(
          ([itemId, quantity]) => ({
            itemId,
            quantity,
          })
        ),
      };

      await axios.post(`/api/orders/${order.id}/split-bill`, payload, {
        withCredentials: true,
      });
      toast.success("Facture divisée avec succès !");
      fetchTables();
      setTable(null);
      onclose();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la division."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onclose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Diviser la facture</DialogTitle>
            <DialogDescription>
              Sélectionnez les articles à transférer vers une autre table.
            </DialogDescription>
          </DialogHeader>

          {order && order.items?.length ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto border p-3 rounded-md">
              {order.items.map((i) => (
                <div
                  key={i.itemId || i.item._id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        selectedItems[i.itemId || i.item._id] !== undefined
                      }
                      onCheckedChange={(checked) =>
                        handleSelectItem(i.itemId || i.item._id, checked)
                      }
                    />
                    <span className="font-medium">{i.item.name}</span>
                  </div>
                  {selectedItems[i.itemId || i.item._id] !== undefined && (
                    <Input
                      type="number"
                      min={1}
                      max={i.quantity}
                      value={selectedItems[i.itemId || i.item._id]}
                      onChange={(e) =>
                        handleQuantityChange(
                          i.itemId || i.item._id,
                          e.target.value
                        )
                      }
                      className="w-20 text-right"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              Aucun article trouvé.
            </p>
          )}

          <div className="mt-4">
            <Label>Choisir la nouvelle table</Label>
            <Select onValueChange={setNewTableId}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Choisir une table" />
              </SelectTrigger>
              <SelectContent>
                {tables.length > 0 ? (
                  tables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      Table {t.number}
                    </SelectItem>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 p-2">
                    Aucune table disponible
                  </p>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onclose}>
              Annuler
            </Button>
            <Button disabled={loading} onClick={handleSplitClick}>
              {loading ? (
                <Loader className="animate-spin w-4 h-4" />
              ) : (
                "Diviser"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Verification Modal */}
      <AdminVerifyModal
        open={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={handleAdminSuccess}
      />
    </>
  );
};

export default SplitOrder;
