import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { Loader, PrinterCheck, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const PrintersList = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deletePrinterId, setDeletePrinterId] = useState(null);
  const [testPrinterId, setTestPrinterId] = useState(null);
  const [testing, setTesting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editPrinter, setEditPrinter] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchPrinters = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/printers/");
      setPrinters(res.data.printers);
    } catch (error) {
      console.error("Error geting printer");
      toast.error("Error geting printers, try again");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleEditClick = (printer) => {
    setEditPrinter(printer);
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditPrinter({ ...editPrinter, [field]: value });
  };

  const handleConfirmEdit = async () => {
    if (!editPrinter?.id) return;
    setEditLoading(true);
    try {
      const res = await axios.put(
        `/api/printers/update/${editPrinter.id}`,
        {
          name: editPrinter.name,
          ip: editPrinter.ip,
          isDefault: editPrinter.isDefault,
        },
        { withCredentials: true }
      );

      setPrinters(
        printers.map((p) => (p.id === editPrinter.id ? res.data.printer : p))
      );

      toast.success("Printer updated");
    } catch (error) {
      console.error("Error updating printer:", error);
      toast.error("Failed to update printer, please try refreshing the page");
    } finally {
      setEditPrinter(null);
      setIsEditDialogOpen(false);
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (printerId) => {
    setDeletePrinterId(printerId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletePrinterId) return;
    setDeleteLoading(true);

    try {
      await axios.delete(`/api/printers/delete/${deletePrinterId}`, {
        withCredentials: true,
      });
      setPrinters(printers.filter((p) => p.id !== deletePrinterId));
      toast.success("Printer deleted successfully");
    } catch (error) {
      console.error("Error deleting printer:", error);
      toast.error("Failed to delete the printer");
    } finally {
      setDeletePrinterId(null);
      setIsDeleteDialogOpen(false);
      setDeleteLoading(false);
    }
  };

  const handleTestPrinter = async (printerId) => {
    if (!printerId) return;
    setTestPrinterId(printerId);
    setTesting(true);

    try {
      await axios.post(
        `/api/printers/test/${printerId}`,
        {},
        { withCredentials: true }
      );
      toast.success("Printer tested successfully");
    } catch (error) {
      console.error("Error testing printer:", error);
      toast.error("Failed to test the printer");
    } finally {
      setTesting(false);
      setTestPrinterId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-muted-foreground flex justify-center items-center">
          <Loader className="animate-spin size-4" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pl-6">
        <h1 className="text-xl font-semibold mb-4">Printer Lists</h1>

        {printers.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No printers found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shad">
            <table className="min-w-full divide-y">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ip Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Default
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {printers.map((printer) => (
                  <tr key={printer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {printer.name}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {printer.ip}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          printer.isDefault
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {printer.isDefault ? "Yes" : "No"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleTestPrinter(printer.id)}
                        disabled={testing && testPrinterId === printer.id}
                      >
                        {testing && testPrinterId === printer.id ? (
                          <Loader className="animate-spin size-4" />
                        ) : (
                          <PrinterCheck />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(printer)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(printer.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to delete this printer? This action cannot
              be undone.
            </p>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {deleteLoading ? (
                  <Loader className="animate-spin size-4" />
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Printer</DialogTitle>
            </DialogHeader>

            {editPrinter && (
              <div className="space-y-4 mt-2">
                <Input
                  value={editPrinter.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  placeholder="Name"
                />
                <Input
                  value={editPrinter.ip}
                  onChange={(e) => handleEditChange("ip", e.target.value)}
                  placeholder="Ip Address"
                />

                <div className="flex items-center gap-4">
                  <span>Default:</span>
                  <Switch
                    checked={editPrinter.isDefault}
                    onCheckedChange={(val) =>
                      handleEditChange("isDefault", val)
                    }
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="default" onClick={handleConfirmEdit}>
                {editLoading ? (
                  <Loader className="animate-spin size-4" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PrintersList;
