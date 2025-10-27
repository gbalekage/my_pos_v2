import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const TableList = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/tables");
      setTables(res.data.tables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to load tables, please try again");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-40 text-muted-foreground">
          <Loader className="animate-spin size-4" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Tables List</h1>

        {tables.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No tables found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Table Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {tables.map((table) => (
                  <tr key={table.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {table.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Table {table.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={`${
                          table.status === "AVAILABLE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {table.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TableList;
