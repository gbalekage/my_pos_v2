import React, { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { ThemeButton } from "@/components/global/theme-btn";
import { Loader, LogOutIcon, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserProfile from "@/components/attendants/UserProfile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";
import { toast } from "sonner";
import SalesModal from "@/components/cashier/SalesModal"; // ✅ import here
import SignedBillsModal from "@/components/cashier/SignedBillsModal";
import ExpensesModal from "@/components/cashier/ExpensesModal";
import { Button } from "@/components/ui/button";
import RecievePayment from "@/components/cashier/ReceivePayment";
import AddExpenseModal from "@/components/cashier/AddExpences";
import CloseDay from "@/components/cashier/CloseDay";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PayOrderModal from "@/components/cashier/PayModal";
import SignOrderModal from "@/components/cashier/SignOrder";

const CashierDashboard = () => {
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showSignedModal, setShowSignedModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [receivePaymentModal, setReceivedPaymentModal] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [closeDay, setCloseDay] = useState(false);
  const [search, setSearch] = useState("");
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signOrderId, setSignOrderId] = useState(null);
  const [payOrderId, setPayOrderId] = useState(null);
  const [payOrderAmount, setPayOrderAmount] = useState(0);

  const [pending, setPending] = useState({ total: 0, count: 0, orders: [] });
  const [sales, setSales] = useState({ total: 0, count: 0, sales: [] });
  const [signedBills, setSignedBills] = useState({
    total: 0,
    count: 0,
    signedBills: [],
  });
  const [expenses, setExpenses] = useState({
    total: 0,
    count: 0,
    expenses: [],
  });

  const [loading, setLoading] = useState({
    pending: false,
    sales: false,
    signed: false,
    expenses: false,
  });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("fr-CD", {
      minimumFractionDigits: 0,
    }).format(amount || 0) + " FC";

  const fetchAllReports = async () => {
    setLoading({
      pending: true,
      sales: true,
      signed: true,
      expenses: true,
    });

    try {
      const [pendingRes, salesRes, signedRes, expensesRes] = await Promise.all([
        axios.get("/api/repports/orders/today/pending-total", {
          withCredentials: true,
        }),
        axios.get("/api/repports/sales/today/total", { withCredentials: true }),
        axios.get("/api/repports/signedBills/today/total", {
          withCredentials: true,
        }),
        axios.get("/api/repports/expenses/today/total", {
          withCredentials: true,
        }),
      ]);

      setPending({
        total: pendingRes.data.totalAmount || 0,
        count: pendingRes.data.count || 0,
        orders: pendingRes.data.pendingOrders || [],
      });

      setSales({
        total: salesRes.data.totalAmount || 0,
        count: salesRes.data.count || 0,
        sales: salesRes.data.todaySales || [],
      });

      setSignedBills({
        total: signedRes.data.totalAmount || 0,
        count: signedRes.data.count || 0,
        signedBills: signedRes.data.signedBills || [],
      });

      setExpenses({
        total: expensesRes.data.totalAmount || 0,
        count: expensesRes.data.count || 0,
        expenses: expensesRes.data.expenses || [],
      });
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch reports data"
      );
    } finally {
      setLoading({
        pending: false,
        sales: false,
        signed: false,
        expenses: false,
      });
    }
  };

  useEffect(() => {
    fetchAllReports();
  }, []);

  // Logout
  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const toggleDropdown = () => setIsDropdownOpen((open) => !open);

  const filteredOrders = pending.orders.filter(
    (order) =>
      order.Table?.number.toString().includes(search.toLowerCase()) ||
      order.attendant?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePay = (orderId) => {
    const order = pending.orders.find((o) => o.id === orderId);
    if (!order) return toast.error("Commande introuvable");
    setPayOrderId(orderId);
    setPayOrderAmount(order.totalAmount);
    setPayModalOpen(true);
  };

  const closePayModal = () => {
    setPayModalOpen(false);
    setPayOrderId(null);
    setPayOrderAmount(0);
  };

  const onPaymentSuccess = async (orderId) => {
    await Promise.all([fetchAllReports()]);
    setPending.orders((prev) => prev.filter((order) => order._id !== orderId));
    toast.success(`Commande ${orderId} payée et retirée.`);
    closePayModal();
  };

  const handleSign = (orderId) => {
    setSignOrderId(orderId);
    setSignModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="shadow px-6 py-4 flex justify-between items-center">
        <h1 className="flex items-center gap-2 text-sm">
          <p className="text-md">Welcome</p>
          <p className="font-semibold">{user.name}</p>
        </h1>

        <div className="flex items-center gap-4">
          <ThemeButton />
          <LogOutIcon
            onClick={handleLogout}
            className="cursor-pointer hover:text-red-500"
          />
          <User
            className="cursor-pointer"
            onClick={() => setShowProfileModal(true)}
          />
        </div>
      </header>

      {/* Stats Cards */}
      <section className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Pending Orders */}
        <Card className="cursor-pointer hover:shadow-lg transition-all min-h-[140px] flex items-center justify-center">
          {loading.pending ? (
            <div className="flex items-center justify-center w-full h-full">
              <Loader className="animate-spin size-6 text-muted-foreground" />
            </div>
          ) : pending.count > 0 ? (
            <CardHeader className="w-full">
              <CardTitle>Pending Orders</CardTitle>
              <p>{pending.count} Pending Orders</p>
              <CardDescription>
                Total: {formatCurrency(pending.total)}
              </CardDescription>
            </CardHeader>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-sm text-muted-foreground">
              No pending orders
            </div>
          )}
        </Card>

        {/* Today Sales */}
        <Card
          onClick={() => setShowSalesModal(true)}
          className="cursor-pointer hover:shadow-lg transition-all min-h-[140px] flex items-center justify-center"
        >
          {loading.sales ? (
            <div className="flex items-center justify-center w-full h-full">
              <Loader className="animate-spin size-6 text-muted-foreground" />
            </div>
          ) : sales.count > 0 ? (
            <CardHeader className="w-full">
              <CardTitle>Today Sales</CardTitle>
              <p>{sales.count} Completed Orders</p>
              <CardDescription>
                Total: {formatCurrency(sales.total)}
              </CardDescription>
            </CardHeader>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-sm text-muted-foreground">
              No completed orders
            </div>
          )}
        </Card>

        {/* Signed Bills */}
        <Card
          onClick={() => setShowSignedModal(true)}
          className="cursor-pointer hover:shadow-lg transition-all min-h-[140px] flex items-center justify-center"
        >
          {loading.signed ? (
            <div className="flex items-center justify-center w-full h-full">
              <Loader className="animate-spin size-4 text-muted-foreground" />
            </div>
          ) : signedBills.count > 0 ? (
            <CardHeader className="w-full">
              <CardTitle>Today Signed Bills</CardTitle>
              <p>{signedBills.count} Signed Bills</p>
              <CardDescription>
                Total: {formatCurrency(signedBills.total)}
              </CardDescription>
            </CardHeader>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-sm text-muted-foreground">
              No signed bills
            </div>
          )}
        </Card>

        {/* Expenses */}
        <Card
          onClick={() => setShowExpensesModal(true)}
          className="cursor-pointer hover:shadow-lg transition-all min-h-[140px] flex items-center justify-center"
        >
          {loading.expenses ? (
            <div className="flex items-center justify-center w-full h-full">
              <Loader className="animate-spin size-4 text-muted-foreground" />
            </div>
          ) : expenses.count > 0 ? (
            <CardHeader className="w-full">
              <CardTitle>Today Expenses</CardTitle>
              <p>{expenses.count} Expenses</p>
              <CardDescription>
                Total: {formatCurrency(expenses.total)}
              </CardDescription>
            </CardHeader>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-sm text-muted-foreground">
              No expenses
            </div>
          )}
        </Card>
      </section>

      {/* Action buttons */}
      <section className="p-6 flex justify-end">
        <div className="relative">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={toggleDropdown}
          >
            Actions
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Button>

          <div
            className={`absolute bg-white right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
              isDropdownOpen ? "block" : "hidden"
            }`}
          >
            <div className="p-2">
              <Button
                variant="link"
                className="w-full text-left"
                onClick={() => setReceivedPaymentModal(true)}
              >
                Recieve Payment
              </Button>
              <Button
                variant="link"
                className="w-full text-left"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                Add Expense
              </Button>
              <Button
                variant="link"
                className="w-full text-left"
                onClick={() => setCloseDay(true)}
              >
                Close Day
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Active orders */}
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Active Orders
            </CardTitle>
            <div className="relative mb-2">
              <Input
                placeholder="Search..."
                className="w-full sm:w-64 border-gray-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent
            className="overflow-auto"
            style={{ maxHeight: "48px + 6 * 48px" }} // header + 6 rows
          >
            <Table className="min-w-full border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0">#</TableHead>
                  <TableHead className="sticky top-0">Table</TableHead>
                  <TableHead className="sticky top-0">Attendant</TableHead>
                  <TableHead className="sticky top-0">Amount</TableHead>
                  <TableHead className="sticky top-0">Status</TableHead>
                  <TableHead className="sticky top-0 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No active orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => (
                    <TableRow key={order.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>Table {order.Table?.number}</TableCell>
                      <TableCell>{order.attendant?.name}</TableCell>
                      <TableCell>
                        {order.totalAmount.toLocaleString()} FC
                      </TableCell>
                      <TableCell>
                        <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs">
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => handlePay(order.id)}>
                          Pay
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSign(order.id)}
                        >
                          Sign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Modals */}
      <SalesModal
        open={showSalesModal}
        onClose={() => setShowSalesModal(false)}
        sales={sales.sales}
        formatCurrency={formatCurrency}
      />

      <SignedBillsModal
        open={showSignedModal}
        onClose={() => setShowSignedModal(false)}
        signedBills={signedBills.signedBills}
        formatCurrency={formatCurrency}
      />

      <ExpensesModal
        open={showExpensesModal}
        onClose={() => setShowExpensesModal(false)}
        expenses={expenses.expenses}
        formatCurrency={formatCurrency}
      />

      <RecievePayment
        isOpen={receivePaymentModal}
        onClose={() => setReceivedPaymentModal(false)}
        user={user}
        signedBills={signedBills.signedBills}
        onSuccess={() => {
          fetchAllReports();
        }}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={() => {
          fetchAllReports();
        }}
      />

      <CloseDay
        isOpen={closeDay}
        onClose={() => setCloseDay(false)}
        onSuccess={() => {
          fetchAllReports();
        }}
      />

      <PayOrderModal
        isOpen={payModalOpen}
        onClose={closePayModal}
        orderId={payOrderId}
        totalAmount={payOrderAmount}
        onPaymentSuccess={onPaymentSuccess}
        setPayModalOpen={setPayModalOpen}
      />

      <SignOrderModal
        isOpen={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        orderId={signOrderId}
        onSuccess={() => {
          fetchAllReports();
        }}
      />

      {user && (
        <UserProfile
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default CashierDashboard;
