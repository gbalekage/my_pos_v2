import { GalleryVerticalEnd, Loader, LucideComputer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export function ActivateForm({ className, ...props }) {
  const [activationCode, setActivationCode] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState();

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get("/api/company");
        setRestaurantId(res.data.company.id);
      } catch (error) {
        console.error("Failed to fetch company:", error);
      }
    };

    fetchCompany();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchSubscription = async () => {
      try {
        const res = await axios.get(
          `/api/subscriptions/current/${restaurantId}`
        );
        setSubscriptionId(res.data.subscription.id);
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      }
    };

    fetchSubscription();
  }, [restaurantId]);

  const handleChange = (e) => {
    setActivationCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/subscriptions/activate", {
        subscriptionId,
        activationCode,
      });

      toast.success(response.data.message);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to activate subscription."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <LucideComputer className="size-6" />
              </div>
              <span className="sr-only">MYPOS</span>
            </a>
            <h1 className="text-lg font-bold">Welcome to MYPOS.</h1>
          </div>
          <Field>
            <FieldLabel htmlFor="activationCode">Activation Code</FieldLabel>
            <Input
              id="activationCode"
              type="text"
              placeholder="Enter activation code"
              disabled={loading}
              value={activationCode}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <Button type="submit" disabled={loading || !activationCode}>
              {loading ? (
                <Loader className="animate-spin size-4" />
              ) : (
                "Activate"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-xs">
        By clicking continue, you agree to our{" "}
        <Link href="#">Terms of Service</Link> and{" "}
        <Link href="#">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
