import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const AddPrinters = () => {
  const [form, setForm] = useState({
    name: "",
    type: "", // USB or ETHERNET
    ip: "",
    port: 9100,
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("/api/printers/add-printer", form, {
        withCredentials: true,
      });
      toast.success("Printer added and tested successfully");
      navigate("/admin/printers/list");
    } catch (error) {
      console.log("Error in add printer", error);
      toast.error(
        error.response?.data?.message || "Error, please try again later"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto mt-10">
        <Card className="p-6 shadow-md">
          <CardHeader>
            <CardTitle>Add Printer</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Printer Name */}
              <div>
                <Label className={"mb-2"}>Printer Name</Label>
                <Input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Kitchen Printer"
                  disabled={loading}
                />
              </div>

              {/* Connection Type */}
              <div>
                <Label className={"mb-2"}>Connection Type</Label>
                <Select
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Connection Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USB">USB</SelectItem>
                    <SelectItem value="ETHERNET">Ethernet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* IP Address (only if Ethernet) */}
              {form.type === "ETHERNET" && (
                <div>
                  <Label className={"mb-2"}>IP Address</Label>
                  <Input
                    type="text"
                    name="ip"
                    value={form.ip}
                    onChange={handleChange}
                    placeholder="192.168.1.100"
                    disabled={loading}
                  />
                </div>
              )}

              {/* Port */}
              <div>
                <Label className={"mb-2"}>Port</Label>
                <Input
                  type="number"
                  name="port"
                  value={form.port}
                  onChange={handleChange}
                  disabled
                />
              </div>

              {/* Default Printer */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  name="isDefault"
                  checked={form.isDefault}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isDefault: checked }))
                  }
                />
                <Label htmlFor="isDefault">Set as default printer</Label>
              </div>

              {/* Submit */}
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader className="animate-spin size-4" />
                  ) : (
                    "Add Printer"
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AddPrinters;
