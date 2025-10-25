import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SignupForm({ ...props }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // 🔹 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("/api/admin/create", formData);
      toast.success("Admin account created successfully!");
      navigate("/")
    } catch (error) {
      console.error("❌ Error creating admin:", error);
      toast.error(error.response?.data?.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <h1 className="font-semibold text-lg">Create an account</h1>
        <p className="text-muted-foreground">
          Enter your information below to create your account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                 disabled={loading}
              />
            </Field>

            <Field>
              <Input
                id="username"
                type="text"
                placeholder="Your Username"
                value={formData.username}
                onChange={handleChange}
                 disabled={loading}
              />
            </Field>

            <Field>
              <Input
                id="email"
                type="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                 disabled={loading}
              />
            </Field>

            <Field>
              <Input
                id="password"
                type="password"
                placeholder="Your Password"
                value={formData.password}
                onChange={handleChange}
                 disabled={loading}
              />
            </Field>

            <Field>
              <Input
                id="password2"
                type="password"
                placeholder="Confirm Your Password"
                value={formData.password2}
                onChange={handleChange}
                 disabled={loading}
              />
            </Field>

            <FieldGroup>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader className="animate-spin size-4" />
                  ) : "Create Account"}
                </Button>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
