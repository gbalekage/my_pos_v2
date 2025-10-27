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
import { Loader } from "lucide-react";

const AddTables = () => {
  const [form, setForm] = useState({
    count: 1,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("/api/tables/create-tables", form, {
        withCredentials: true,
      });
      toast.success("Tables added successfully");
      navigate("/admin/tables/list");
    } catch (error) {
      console.error("Error creating tables:", error);
      toast.error(
        error.response?.data?.message || "Failed to create tables, try again"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-md mx-auto mt-10">
        <Card className="p-6 shadow-md">
          <CardHeader>
            <CardTitle>Add Tables</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Number of Tables */}
              <div>
                <Label>Number of Tables to Add</Label>
                <Input
                  type="number"
                  name="count"
                  min={1}
                  value={form.count}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Submit */}
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader className="animate-spin size-4" />
                  ) : (
                    "Add Tables"
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

export default AddTables;
