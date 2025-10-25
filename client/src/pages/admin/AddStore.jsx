import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const AddStore = () => {
  const [form, setForm] = useState({
    name: "",
    printerId: "",
  });
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPrinters, setFetchingPrinters] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchPrinters = async () => {
    setFetchingPrinters(true);
    try {
      const res = await axios.get("/api/printers", { withCredentials: true });
      setPrinters(res.data.printers);
    } catch (error) {
      console.error("Error fetching printers:", error);
      toast.error("Failed to fetch printers");
    } finally {
      setFetchingPrinters(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Store name is required");
      return;
    }
    if (!form.printerId) {
      toast.error("Please select a printer");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/stores/add-store", form, {
        withCredentials: true,
      });
      toast.success("Store added successfully");
      navigate("/admin/stores/list");
    } catch (error) {
      console.error("Error adding store:", error);
      toast.error(
        error.response?.data?.message || "Error, please try again later"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Ajouter un magasin</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className={"mb-4"}>Nom du magasin</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Bar, Cuisine, VIP..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="printerId" className={"mb-4"}>Imprimante assignée</Label>
                <Select
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, printerId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        fetchingPrinters
                          ? "Chargement des imprimantes..."
                          : "Sélectionner une imprimante"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.length > 0 ? (
                      printers.map((printer) => (
                        <SelectItem key={printer.id} value={printer.id}>
                          {printer.name} — {printer.ipAddress}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled>Aucune imprimante trouvée</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={loading} className={"mt-4"}>
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2 h-4 w-4" />
                    Enregistrement...
                  </>
                ) : (
                  "Ajouter le magasin"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AddStore;
