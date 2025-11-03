import axios from "axios";
import React, { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";

const ITEMS_PER_PAGE = 20;

const CreateOrder = ({ open, onClose, table, fetchTables }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { user } = useUserStore();
  const clearUser = useUserStore((state) => state.clearUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchItems();
      setSelectedItems({});
      setActiveCategory(null);
      setSearchQuery("");
      setPage(1);
      document.body.style.overflow = "hidden"; // prevent background scroll
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const fetchItems = async () => {
    try {
      const res = await axios.get("/api/items");
      setItems(res.data.items || []);
    } catch (error) {
      console.error("Failed to fetch items", error);
      toast.error("Failed to fetch items");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
      toast.error("Failed to fetch categories");
    }
  };

  const handleItemClick = (item) => {
    setSelectedItems((prev) => {
      const currentQty = prev[item.id]?.quantity || 0;
      return {
        ...prev,
        [item.id]: { ...item, quantity: currentQty + 1 },
      };
    });
  };

  const handleQuantityChange = (id, delta) => {
    setSelectedItems((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      }
      return { ...prev, [id]: { ...current, quantity: newQty } };
    });
  };

  const handleRemoveItem = (id) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleCreateOrder = async () => {
    const selected = Object.values(selectedItems).map(({ id, quantity }) => ({
      itemId: id,
      quantity,
    }));

    if (selected.length === 0) {
      toast.warning("Please select at least one item");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "/api/orders/create",
        {
          tableId: table.id,
          items: selected,
        },
        { withCredentials: true }
      );
      clearUser();
      navigate("/");
      toast.success("Order created successfully");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  // Filter items by category and search query
  const filteredItems = (
    activeCategory
      ? items.filter((item) => item.categoryId === activeCategory.id)
      : items
  ).filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  );
  const paginatedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !loading && onClose?.()}
      />

      {/* Modal container */}
      <div className="relative w-[95vw] max-w-none h-[92vh] rounded-2xl bg-white shadow-2xl flex overflow-hidden">
        {/* LEFT: selected items & categories (25% width) */}
        <aside className="w-1/4 min-w-[320px] border-r overflow-y-auto p-4 flex flex-col">
          <header className="mb-4">
            <h2 className="text-lg font-semibold">
              Table {table?.number || ""}
            </h2>
            <p className="text-sm text-muted-foreground">Select items to add</p>
          </header>

          {/* Selected items */}
          <section className="flex-1 overflow-y-auto">
            <h3 className="font-medium mb-2">Selected Items</h3>

            {Object.keys(selectedItems).length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No items selected
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(selectedItems).map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.price} FC
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(it.id, -1)}
                        className="w-8 h-8 grid place-items-center rounded-md border hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="w-8 text-center">{it.quantity}</div>

                      <button
                        type="button"
                        onClick={() => handleQuantityChange(it.id, 1)}
                        className="w-8 h-8 grid place-items-center rounded-md border hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="w-8 h-8 grid place-items-center rounded-md border text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Create/Add button */}
          <footer className="mt-4">
            <div className="mb-2 text-sm text-muted-foreground">
              Total items:{" "}
              {Object.values(selectedItems).reduce((s, i) => s + i.quantity, 0)}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => !loading && onClose?.()}
                className="flex-1 px-4 py-2 rounded-md border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-md text-white ${
                  loading ? "bg-gray-400" : "bg-primary"
                }`}
              >
                {loading ? "Creating..." : "Create Order"}
              </button>
            </div>
          </footer>
        </aside>

        {/* RIGHT: main area (75%) */}
        <main className="flex-1 flex flex-col overflow-hidden p-6">
          {/* Header area inside main */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="text-xl font-semibold">Choose Items</h3>
              <p className="text-sm text-muted-foreground">
                Click an item to increment qty
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {/* Category buttons */}
              <div className="flex items-center gap-2 overflow-x-auto mt-2 sm:mt-0">
                <div className="text-sm text-muted-foreground">Category:</div>
                <button
                  className={`px-3 py-1 rounded-md border ${
                    !activeCategory ? "bg-primary text-white" : "bg-white"
                  }`}
                  onClick={() => {
                    setActiveCategory(null);
                    setPage(1);
                  }}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-md border ${
                      activeCategory?.id === cat.id
                        ? "bg-primary text-white"
                        : "bg-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search input */}
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1 border rounded-md mb-4"
            />

          {/* Items grid + pagination */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {paginatedItems.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 rounded-lg border cursor-pointer select-none flex flex-col justify-between transition hover:shadow-md ${
                      selectedItems[item.id]
                        ? "ring-2 ring-primary/60 bg-primary/5"
                        : "bg-white"
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-sm mb-1 truncate">
                        {item.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm font-medium">{item.price} FC</div>
                      {selectedItems[item.id] && (
                        <div className="text-xs text-primary">
                          Qty: {selectedItems[item.id].quantity}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-md border disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-sm">
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-md border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateOrder;
