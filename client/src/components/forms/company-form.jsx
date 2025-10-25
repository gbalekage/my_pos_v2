import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FieldGroup } from "../ui/field";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function CompanyForm({ className, ...props }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phoneNumber: "",
    logo: null,
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setFormData({ ...formData, logo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const data = new FormData();
    data.append("name", formData.name);
    data.append("address", formData.address);
    data.append("email", formData.email);
    data.append("phoneNumber", formData.phoneNumber);
    data.append("logo", formData.logo);

    const res = await axios.post("/api/company", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 201) {
      toast.success("Company created successfully!");
      
      setFormData({ name: "", address: "", email: "", phoneNumber: "", logo: null });
      navigate("/")
    }
  } catch (err) {
    console.error(err);

    const backendMessage = err.response?.data?.message;
    
    if (typeof backendMessage === "string") {
      toast.error(backendMessage);
    } else if (typeof backendMessage === "object") {
      Object.values(backendMessage).forEach((msg) => {
        toast.error(msg);
      });
    } else {
      toast.error("Error creating company");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-xs text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        <Input
          type="text"
          name="name"
          placeholder="Company Name"
          value={formData.name}
          onChange={handleChange}
          className={"text-xs placeholder:text-xs"}
        />
        <Input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className={"text-xs placeholder:text-xs"}
        />
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className={"text-xs placeholder:text-xs"}
        />
        <Input
          type="tel"
          name="phoneNumber"
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChange={handleChange}
          className={"text-xs placeholder:text-xs"}
        />
        <Input
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleChange}
          className={"text-xs placeholder:text-xs"}
        />
        <Button type="submit" disabled={loading} className="w-full" size={"sm"} >
          {loading ? (
            <Loader className="animate-spin size-4" />
          ) : (
            "Create Company"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
