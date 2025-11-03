import AddItems from "@/components/attendants/AddItems";
import BreakItemModal from "@/components/attendants/BreakItems";
import CreateOrder from "@/components/attendants/CreateOrder";
import DiscountModal from "@/components/attendants/DiscountModal";
import RemoveItems from "@/components/attendants/RemoveItems";
import SplitOrder from "@/components/attendants/SplitOrder";
import UserProfile from "@/components/attendants/UserProfile";
import { ThemeButton } from "@/components/global/theme-btn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import {
  Loader,
  LogOutIcon,
  SlashIcon,
  Split,
  StepBack,
  StepForward,
  Subscript,
  Trash,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AttendantDashboard = () => {
  const { user } = useUserStore();
  const clearUser = useUserStore((state) => state.clearUser);
  const [tables, setTables] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const tablesPerPage = 15;
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [splitModal, setSetSplitModal] = useState(false);
  const [breakModal, setBreakModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await axios.get("/api/tables");
      setTables(res.data.tables);
    } catch (error) {
      console.log("Error getting tables", error);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const indexOfLastTable = currentPage * tablesPerPage;
  const indexOfFirstTable = indexOfLastTable - tablesPerPage;
  const currentTables = tables.slice(indexOfFirstTable, indexOfLastTable);

  const totalPages = Math.ceil(tables.length / tablesPerPage);

  const handleTableClick = async (table) => {
    const attendantId = table.attendantId;
    const userId = user.id;

    if (table.status === "OCCUPIED" && attendantId !== userId) {
      toast.error("Not allowed, this is order if for an other attedant");
      return;
    }

    setSelectedTable(table);
    setLoadingOrder(true);
    try {
      const res = await axios.get(`/api/orders/table/${table.id}`, {
        withCredentials: true,
      });
      setOrder(res.data.order);
    } catch (error) {
      toast.error(error.response?.data?.message);
      console.log("Error getting tables", error);
      setOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const printBill = async () => {
    setPrinting(true);
    try {
      const res = await axios.get(
        `/api/orders/print-bill/${selectedTable.id}`,
        { withCredentials: true }
      );
      toast.error("Bill Printed");
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Cart side */}
      <div className="md:w-1/4 w-full border-r p-4 flex flex-col justify-between">
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          {!selectedTable ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-muted-foreground">
                Select a table to continue
              </p>
            </div>
          ) : loadingOrder ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="animate-spin size-5" />
            </div>
          ) : order && order.items.length > 0 ? (
            <>
              <h3 className="font-semibold mb-2">
                Table {selectedTable.number}
              </h3>
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span>{item.item.name}</span>
                    <span>
                      {item.quantity} × {item.item.price} FC
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t pt-2 text-right font-semibold">
                Total: {order.totalAmount} FC
              </div>

              <div className="mt-6 flex flex-col gap-4 justify-center">
                <Button
                  disabled={printing}
                  className={"w-full"}
                  onClick={printBill}
                >
                  {printing ? (
                    <Loader className="animate-spin size-4" />
                  ) : (
                    "Print Bill"
                  )}
                </Button>
                <div className="flex items-center gap-4 justify-center">
                  {/* remove Items modal opren trigger */}
                  <Button
                    variant={"outline"}
                    onClick={() => setShowRemoveModal(true)}
                  >
                    <Trash />
                  </Button>
                  {/* Discount bill by % */}
                  <Button
                    variant={"outline"}
                    onClick={() => setShowDiscountModal(true)}
                  >
                    <Subscript />
                  </Button>
                  {/* split items modal trigger */}
                  <Button
                    variant={"outline"}
                    onClick={() => setSetSplitModal(true)}
                  >
                    <Split />
                  </Button>
                  {/* Break items quantity */}
                  <Button
                    variant={"outline"}
                    onClick={() => setBreakModal(true)}
                  >
                    <SlashIcon />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-muted-foreground">
                No active order on table {selectedTable.number}.
              </p>
            </div>
          )}
        </div>

        {/* Bottom fixed button */}
        {selectedTable && (
          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => {
                if (order && order.items?.length > 0) {
                  setShowAddModal(true);
                } else {
                  setShowCreateModal(true);
                }
              }}
            >
              {order && order.items?.length > 0
                ? "Add Items to Order"
                : "Create New Order"}
            </Button>
          </div>
        )}
      </div>

      {/* Tables side */}
      <div className="md:w-3/4 w-full flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <h1 className="flex gap-2 items-center text-xl">
            Hello <p className="font-black">{user.name}</p>
          </h1>
          <div className="flex items-center gap-4">
            <ThemeButton />
            <LogOutIcon onClick={handleLogout} className="cursor-pointer" />
            <User
              className="cursor-pointer"
              onClick={() => setShowProfileModal(true)}
            />
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-5 gap-4 p-4">
          {currentTables.map((table) => (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`p-14 rounded-lg shadow-md text-center font-semibold transition-all 
                ${
                  table.status === "OCCUPIED"
                    ? table.attendantId === user.id
                      ? "bg-yellow-100 cursor-pointer"
                      : "bg-red-100 cursor-not-allowed opacity-70"
                    : "bg-[#51ff0016] cursor-pointer"
                }`}
            >
              <div className="flex flex-col items-center">
                <h1 className="flex">Table {table.number}</h1>
                <Badge
                  className={`${
                    table.status === "OCCUPIED"
                      ? table.attendantId === user.id
                        ? "bg-yellow-500 text-foreground"
                        : "bg-red-500 text-foreground"
                      : "bg-green-500 text-foreground"
                  }`}
                >
                  {table.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 py-3">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="flex items-center gap-1"
            >
              <StepBack size={18} />
            </Button>

            <span className="text-sm">
              Page <strong>{currentPage}</strong> of {totalPages}
            </span>

            <Button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="flex items-center gap-1"
            >
              <StepForward size={18} />
            </Button>
          </div>
        )}
      </div>

      {selectedTable && (
        <CreateOrder
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          table={selectedTable}
          fetchTables={fetchTables}
        />
      )}

      {selectedTable && (
        <AddItems
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          table={selectedTable}
          order={order}
          fetchTables={fetchTables}
          setTable={setSelectedTable}
        />
      )}

      {selectedTable && order && (
        <RemoveItems
          open={showRemoveModal}
          onclose={() => setShowRemoveModal(false)}
          order={order}
          user={user}
          fetchTables={fetchTables}
          setTable={setSelectedTable}
        />
      )}

      {selectedTable && order && (
        <DiscountModal
          open={showDiscountModal}
          onclose={() => setShowDiscountModal(false)}
          order={order}
          user={user}
          fetchTables={fetchTables}
        />
      )}

      {selectedTable && order && (
        <SplitOrder
          open={splitModal}
          onclose={() => setSetSplitModal(false)}
          order={order}
          fetchTables={fetchTables}
          setTable={setSelectedTable}
        />
      )}

      {selectedTable && order && (
        <BreakItemModal
          open={breakModal}
          onclose={() => setSetSplitModal(false)}
          order={order}
          fetchTables={fetchTables}
          setTable={setSelectedTable}
        />
      )}

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

export default AttendantDashboard;
