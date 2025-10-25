import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ProfileContent() {
  const [company, setCompany] = useState(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPlanType, setNewPlanType] = useState("MONTHLY");
  const [duration, setDuration] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedAttendant, setSelectedAttendant] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const navigate = useNavigate();

  const fetchCompany = async () => {
    try {
      const res = await axios.get("/api/company", { withCredentials: true });
      setCompany(res.data.company);
    } catch (error) {
      console.error("Error fetching company:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlan = async (companyId) => {
    try {
      if (!companyId) return;
      const res = await axios.get(`/api/subscriptions/current/${companyId}`, {
        withCredentials: true,
      });
      setSubscriptionPlan(res.data.subscription);
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
    }
  };

  const handleChangePlan = async () => {
    try {
      if (!subscriptionPlan?.id) {
        toast.error("Subscription not found");
        return;
      }

      const res = await axios.patch(
        "/api/subscriptions/change-plan",
        {
          subscriptionId: subscriptionPlan.id,
          newPlanType,
          duration: Number(duration),
        },
        { withCredentials: true }
      );

      toast.success(res.data.message);
      setOpenDialog(false);
      fetchSubscriptionPlan(company.id);
      navigate("/activate-subscription");
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error(error.response?.data?.message || "Failed to update plan");
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  useEffect(() => {
    if (company?.id) {
      fetchSubscriptionPlan(company.id);
    }
  }, [company]);

  const handleViewSales = () => {
    toast.info(
      `Viewing sales for ${selectedStore || "All Stores"} - ${
        selectedAttendant || "All Attendants"
      } on ${selectedDate || "today"}`
    );
  };

  return (
    <Tabs defaultValue="subscription" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
      </TabsList>

      {/* ✅ SALES TAB */}
      <TabsContent value="sales" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              View sales by store, attendant, and date.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Store</Label>
                <Select
                  value={selectedStore}
                  onValueChange={(value) => setSelectedStore(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant Store</SelectItem>
                    <SelectItem value="bar">Bar Store</SelectItem>
                    <SelectItem value="vip">VIP Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Attendant</Label>
                <Select
                  value={selectedAttendant}
                  onValueChange={(value) => setSelectedAttendant(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Attendant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john">John Doe</SelectItem>
                    <SelectItem value="marie">Marie Claire</SelectItem>
                    <SelectItem value="peter">Peter Simba</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <Button onClick={handleViewSales}>View Sales</Button>
            </div>

            {/* Results Section (Placeholder for chart or table) */}
            <Separator />
            <div className="text-center py-6 text-muted-foreground border rounded-md">
              <p className="text-sm">
                Sales results will appear here after you click “View Sales”.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ✅ SUBSCRIPTION TAB */}
      <TabsContent value="subscription" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Settings</CardTitle>
            <CardDescription>
              Manage your account subscription.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Subscription Status</Label>
              </div>
              <Badge
                variant="outline"
                className={`${
                  subscriptionPlan?.isActive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {subscriptionPlan?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Subscription Plan</Label>
                {subscriptionPlan ? (
                  <p className="text-muted-foreground text-sm">
                    {subscriptionPlan.planType === "MONTHLY"
                      ? "Monthly Plan"
                      : "Yearly Plan"}{" "}
                    -{" "}
                    {subscriptionPlan.status.charAt(0).toUpperCase() +
                      subscriptionPlan.status.slice(1)}
                    <br />
                    {(() => {
                      const endDate = new Date(subscriptionPlan.endDate);
                      const today = new Date();
                      const timeDiff = endDate - today;
                      const remainingDays = Math.ceil(
                        timeDiff / (1000 * 60 * 60 * 24)
                      );

                      if (remainingDays > 0) {
                        return (
                          <span
                            className={`${
                              remainingDays <= 5
                                ? "text-red-600 font-medium"
                                : "text-green-600"
                            }`}
                          >
                            {remainingDays} day
                            {remainingDays > 1 ? "s" : ""} remaining
                          </span>
                        );
                      } else if (remainingDays === 0) {
                        return (
                          <span className="text-yellow-600 font-medium">
                            Expires today
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-red-600 font-medium">
                            Expired {Math.abs(remainingDays)} day
                            {Math.abs(remainingDays) > 1 ? "s" : ""} ago
                          </span>
                        );
                      }
                    })()}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No subscription found
                  </p>
                )}
              </div>

              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">Upgrade Subscription</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Subscription Plan</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Plan Type</Label>
                      <Select
                        value={newPlanType}
                        onValueChange={(value) => setNewPlanType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Duration ({newPlanType === "MONTHLY" ? "months" : "years"})
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={handleChangePlan}>Confirm Change</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
