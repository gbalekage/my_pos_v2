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
import { Loader } from "lucide-react";
import { useUserStore } from "@/store/userStore";

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
  const [sales, setSales] = useState([]);
  const [stores, setStores] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const clearUser = useUserStore((state) => state.clearUser);

  const fetchStores = async () => {
    try {
      const res = await axios.get("/api/stores", { withCredentials: true });
      setStores(res.data.stores || []);
    } catch (error) {
      console.error(error);
      toast.error("Error while fetching stores.");
    }
  };

  const fetchAttendants = async () => {
    try {
      const res = await axios.get("/api/users/attendants", {
        withCredentials: true,
      });
      setAttendants(res.data.attendants || []);
    } catch (error) {
      console.error(error);
      toast.error("Error while fetching attendants.");
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/sales/chart/sales", {
        params: {
          store: selectedStore || undefined,
          attendant: selectedAttendant || undefined,
          date: selectedDate || undefined,
        },
        withCredentials: true,
      });

      setSales(res.data.sales || []);
    } catch (error) {
      console.error(error);
      toast.error("Error while fetching sales data.");
    } finally {
      setLoading(false);
    }
  };

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
    fetchSales();
    fetchStores();
    fetchAttendants();
  }, []);

  useEffect(() => {
    if (company?.id) {
      fetchSubscriptionPlan(company.id);
    }
  }, [company]);

  const handlePasswordUpdate = async () => {
    setIsUpdatingPassword(true);
    try {
      const res = await axios.put("/api/users/password", passwordForm, {
        withCredentials: true,
      });
      toast.success(res.data.message || "Password updated successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      clearUser();
      navigate("/");
      toast.success("Please log in again with your new password.");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to update password."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Tabs defaultValue="sales" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
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
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.name}>
                        {store.name}
                      </SelectItem>
                    ))}
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
                    {attendants.map((attendant) => (
                      <SelectItem key={attendant.id} value={attendant.name}>
                        {attendant.name}
                      </SelectItem>
                    ))}
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
              <Button onClick={fetchSales}>View Sales</Button>
            </div>

            {/* Results Table */}
            <Separator />
            {loading ? (
              <p className="text-center py-4">Loading...</p>
            ) : sales.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No sales found.</p>
            ) : (
              <UiTable>
                <TableHeader>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Sale ID</TableCell>
                    <TableCell>Attendant</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Total (FC)</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        {new Date(s.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{s.id}</TableCell>
                      <TableCell>{s.attendant?.name}</TableCell>
                      <TableCell>{s.table?.number || "-"}</TableCell>
                      <TableCell>{s.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </UiTable>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ✅ SUBSCRIPTION TAB */}
      <TabsContent value="subscription" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Settings</CardTitle>
            <CardDescription>Manage your account subscription.</CardDescription>
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
                        Duration (
                        {newPlanType === "MONTHLY" ? "months" : "years"})
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

      <TabsContent value="account" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Update your password</CardTitle>
            <CardDescription>
              Change your account password regularly to keep your account
              secure.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Password Update */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        password: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? (
                    <Loader className="animate-spin size-4" />
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
