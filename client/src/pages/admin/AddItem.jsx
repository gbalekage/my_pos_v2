import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Function to generate a random alphanumeric string
const generateBarcode = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const AddItem = () => {
  const [form, setForm] = useState({
    name: "",
    storeId: "",
    categoryId: "",
    stock: 0,
    price: 0,
    barcode: generateBarcode(), // Generate barcode on load
    package: "",
  });
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storesRes, categoriesRes] = await Promise.all([
          axios.get("/api/stores", { withCredentials: true }),
          axios.get("/api/categories", { withCredentials: true }),
        ]);
        setStores(storesRes.data.stores);
        setCategories(categoriesRes.data.categories);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load stores or categories");
      }
    };
    fetchData();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/items", form, { withCredentials: true });
      toast.success("Item added successfully");
      navigate("/admin/items/list");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto mt-10">
        <Card className="p-6 shadow-md">
          <CardHeader><CardTitle>Add Item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>

              <div>
                <Label>Store</Label>
                <Select value={form.storeId} onValueChange={(v) => handleChange("storeId", v)} required>
                  <SelectTrigger><SelectValue placeholder="Select Store" /></SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => handleChange("categoryId", v)} required>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => handleChange("stock", parseInt(e.target.value))} required />
              </div>

              <div>
                <Label>Price</Label>
                <Input type="number" value={form.price} onChange={(e) => handleChange("price", parseFloat(e.target.value))} required />
              </div>

              <div>
                <Label>Barcode</Label>
                <Input value={form.barcode} disabled /> {/* Disabled input */}
              </div>

              <div>
                <Label>Package</Label>
                <Input value={form.package} onChange={(e) => handleChange("package", e.target.value)} />
              </div>

              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader className="animate-spin size-4" /> : "Add Item"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AddItem;
