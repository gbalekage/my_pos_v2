import React from "react";
import { Route, Routes, Outlet } from "react-router-dom";
import Connexion from "./pages/config/Connexion";
import ServerConfig from "./pages/config/ServerConfig";
import HomePage from "./pages/main/HomePage";
import CreateCompany from "./pages/main/CreateCompany";
import ChooseSubscription from "./pages/main/ChooseSubscription";
import ActivateSubscription from "./pages/main/ActivateSubscription";
import SubscriptionCheck from "./components/main/SubscriptionCheck";
import { Toaster } from "sonner";
import CreateAdmin from "./pages/main/CreateAdmin";
import ErrorPage from "./pages/main/ErrorPage";
import Dashboard from "./pages/admin/Dashboard";
import AdminAccount from "./pages/admin/Account";
import AttendantDashboard from "./pages/attendants/Dashboard";
import ManagerDashboard from "./pages/managers/Dashboard";
import CashierDashboard from "./pages/cashier/Dashboard";
import UsersList from "./pages/admin/UsersList";
import AddUser from "./pages/admin/AddUser";
import PrintersList from "./pages/admin/PrintersList";
import AddPrinters from "./pages/admin/AddPrinters";
import AddStore from "./pages/admin/AddStore";
import StoreList from "./pages/admin/StoreList";
import AddCategory from "./pages/admin/AddCategory";
import CategoryList from "./pages/admin/CategoryList";
import ItemList from "./pages/admin/ItemList";
import AddItem from "./pages/admin/AddItem";
import AddTables from "./pages/admin/AddTables";
import TableList from "./pages/admin/TableList";
import ActiveOrders from "./pages/admin/ActiveOrders";
import Sales from "./pages/admin/Sales";
import ClientList from "./pages/admin/ClientList";
import Cancelations from "./pages/admin/Cancelations";

// Layout component for admin routes
const AdminLayout = () => <Outlet />;

const App = () => {
  return (
    <>
      <Routes>
        {/* Config routes */}
        <Route path="/config" element={<ServerConfig />} />
        <Route path="/retry" element={<Connexion />} />

        {/* Company & subscription */}
        <Route path="/create-company" element={<CreateCompany />} />
        <Route path="/choose-subscription" element={<ChooseSubscription />} />
        <Route
          path="/activate-subscription"
          element={<ActivateSubscription />}
        />
        <Route path="/create-admin" element={<CreateAdmin />} />
        <Route path="/error" element={<ErrorPage />} />

        {/* Home */}
        <Route
          path="/"
          element={
            <SubscriptionCheck>
              <HomePage />
            </SubscriptionCheck>
          }
        />

        <Route
          path="/admin"
          element={
            <SubscriptionCheck>
              <AdminLayout />
            </SubscriptionCheck>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="account" element={<AdminAccount />} />
          <Route path="users/list" element={<UsersList />} />
          <Route path="stores/list" element={<StoreList />} />
          <Route path="users/add" element={<AddUser />} />
          <Route path="categories/add" element={<AddCategory />} />
          <Route path="categories/list" element={<CategoryList />} />
          <Route path="stores/add" element={<AddStore />} />
          <Route path="printers/list" element={<PrintersList />} />
          <Route path="printers/add" element={<AddPrinters />} />
          <Route path="items/list" element={<ItemList />} />
          <Route path="items/add" element={<AddItem />} />
          <Route path="tables/add" element={<AddTables />} />
          <Route path="tables/list" element={<TableList />} />
          <Route path="orders/active" element={<ActiveOrders />} />
          <Route path="sales/all" element={<Sales />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="cancellations" element={<Cancelations />} />
        </Route>

        {/* Other roles */}
        <Route
          path="/attendant/dashboard"
          element={
            <SubscriptionCheck>
              <AttendantDashboard />
            </SubscriptionCheck>
          }
        />
        <Route
          path="/manager/dashboard"
          element={
            <SubscriptionCheck>
              <ManagerDashboard />
            </SubscriptionCheck>
          }
        />
        <Route
          path="/cashier/dashboard"
          element={
            <SubscriptionCheck>
              <CashierDashboard />
            </SubscriptionCheck>
          }
        />
      </Routes>

      <Toaster />
    </>
  );
};

export default App;
