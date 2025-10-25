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

const AddCategory = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("/api/categories/add-category", form, {
        withCredentials: true,
      });
      toast.success("Category added");
      navigate("/admin/categories/list");
    } catch (error) {
      console.log("Error in add category", error);
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
            <CardTitle>Add Category</CardTitle>
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

              <div>
                <Label className={"mb-2"}>Description</Label>
                <Input
                  type="text"
                  name="description"
                  value={form.description}
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
                    "Add Category"
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

export default AddCategory;
