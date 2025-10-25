import AdminLayout from "@/components/admin/AdminLayout";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import axios from "axios";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

const roles = ["ATTENDANT", "CASHIER", "MANAGER", "ADMIN"];

const AddUser = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/users/create", data, {
        withCredentials: true,
      });
      toast.success("User created successfully!");
      reset();
      navigate("/admin/users/list");
    } catch (error) {
      console.error("Create user error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 w-full max-w-md"
        >
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <Input
              {...register("name", { required: "Name is required" })}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs">{errors.name.message}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block mb-1 font-medium">Username</label>
            <Input
              {...register("username", { required: "Username is required" })}
              disabled={loading}
            />
            {errors.username && (
              <p className="text-red-500 text-xs">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <Input
              type="email"
              {...register("email", { required: "Email is required" })}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <Input
              type="password"
              {...register("password", { required: "Password is required" })}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1 font-medium">Confirm Password</label>
            <Input
              type="password"
              {...register("password2", { required: "Confirm your password" })}
              disabled={loading}
            />
            {errors.password2 && (
              <p className="text-red-500 text-xs">{errors.password2.message}</p>
            )}
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="block mb-1 font-medium">Role</label>
            <Controller
              control={control}
              name="role"
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-red-500 text-xs">{errors.role.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? (
              <Loader className="animate-spin w-4 h-4 mx-auto" />
            ) : (
              "Create User"
            )}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddUser;
