import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$35 / Month",
    description:
      "Ideal for small to large restaurants. Includes all POS features.",
    features: [
      "Unlimited orders and bills",
      "Multiple user roles (Cashier, Attendant, Manager)",
      "Daily reports and analytics",
      "Multi-store support (Bar & Kitchen)",
      "Email support",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$350 / Year",
    description:
      "Ideal for small to large restaurants. Includes all POS features.",
    features: [
      "Unlimited orders and bills",
      "Multiple user roles (Cashier, Attendant, Manager)",
      "Daily reports and analytics",
      "Multi-store support (Bar & Kitchen)",
      "Email support",
    ],
  },
];

const ChooseSubscription = () => {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [duration, setDuration] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const navigate = useNavigate()

  const handleCardSelect = (planName) => {
    setSelectedPlan(planName);
    setDuration(planName === "Yearly" ? "12" : "1");
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPlan || !duration) {
      alert("Please select a plan and duration.");
      return;
    }

    const planType = selectedPlan.toUpperCase();

    try {
      const response = await axios.post("/api/subscriptions/choose", {
        restaurantId,
        planType,
        duration: parseInt(duration),
      });

      toast.success(response.data.message);
      navigate("/")
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create subscription.");
    }
  };

  return (
    <div className="flex flex-col gap-10 px-8 py-16">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-[1rem] font-semibold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-2xl mx-auto">
          Select a subscription plan that fits your restaurant.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="flex justify-center gap-6 flex-wrap">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative w-full max-w-[280px] text-left flex flex-col justify-between cursor-pointer",
              selectedPlan === plan.name && "border border-primary"
            )}
          >
            <CardHeader>
              <CardTitle className="font-medium text-[0.9rem]">
                {plan.name}
              </CardTitle>
              <p className="text-[0.6rem] text-muted-foreground">
                {plan.description}
              </p>
              <p className="font-semibold">{plan.price}</p>
            </CardHeader>

            <CardContent className="grid gap-2">
              {plan.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-muted-foreground text-[10px]"
                >
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  {feature}
                </div>
              ))}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full text-xs"
                size="sm"
                variant="default"
                onClick={() => handleCardSelect(plan.name)}
              >
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Subscription Form */}
      <div className="max-w-md mx-auto w-full bg-muted/30 p-6 rounded-xl shadow-sm">
        <div className="mb-4 text-center">
          <h2 className="text-[0.8rem] font-semibold">
            Continue your Subscription
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Choose your plan type and duration to complete your subscription.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="w-1/2">
              <label htmlFor="planType" className="text-xs font-medium">
                Plan Type
              </label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.name}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Input */}
            <div className="w-1/2">
              <label htmlFor="duration" className="text-xs font-medium">
                Duration (Months)
              </label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Subscribe <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChooseSubscription;
