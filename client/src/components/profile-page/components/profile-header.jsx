import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Camera,
  Calendar,
  Mail,
  MapPin,
  Loader,
  Edit2,
  Phone,
  SaveIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function ProfileHeader() {
  const [company, setCompany] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchCompany = async () => {
    try {
      const res = await axios.get("/api/company", { withCredentials: true });
      setCompany(res.data.company);
      setEditData({
        name: res.data.company.name || "",
        address: res.data.company.address || "",
        email: res.data.company.email || "",
        phoneNumber: res.data.company.phoneNumber || "",
      });
    } catch (error) {
      console.error("Error fetching company:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmin = async () => {
    try {
      const res = await axios.get("/api/admin", { withCredentials: true });
      setAdmin(res.data.admin);
    } catch (error) {
      console.log("Error fetching admin:", error);
    }
  };

  useEffect(() => {
    fetchCompany();
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedFile || !company) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("logo", selectedFile);

    try {
      const res = await axios.post(
        `/api/company/upload-logo/${company.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      setCompany(res.data.company);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      console.error("Logo upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const res = await axios.put(`/api/company/${company.id}`, editData, {
        withCredentials: true,
      });
      setCompany(res.data.company);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <Loader className="animate-spin size-4" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="p-3 bg-[#ff04042a]">No company found.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24 border-3 border-primary">
              <AvatarImage
                src={
                  preview
                    ? preview
                    : company.logoUrl
                    ? `http://localhost:5000${company.logoUrl}`
                    : null
                }
                alt={company.name}
              />
              <AvatarFallback className="text-2xl">
                {company.name[0]}
              </AvatarFallback>
            </Avatar>

            {/* Show camera only if no file is selected */}
            {!selectedFile && (
              <label className="absolute -right-2 -bottom-2 cursor-pointer rounded-full p-2 shadow bg-input">
                <Camera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}

            {selectedFile && (
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUploadLogo}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader className="animate-spin size-4" />
                  ) : (
                    <SaveIcon />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-xl font-bold">{company.name}</h1>
              <Badge variant="secondary" className={"text-xs"}>
                Resto - Bar
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">Owner: {admin.name}</p>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                {company.email}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <MapPin className="size-4" />
                {company.address}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Phone className="size-4" />
                {company.phoneNumber}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditModalOpen(true)}>
            Edit Profile
          </Button>
        </div>

        {/* edit dialog */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <Input
                placeholder="Name"
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
              <Input
                placeholder="Address"
                value={editData.address}
                onChange={(e) =>
                  setEditData({ ...editData, address: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={editData.email}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
                }
              />
              <Input
                placeholder="Phone Number"
                value={editData.phoneNumber}
                onChange={(e) =>
                  setEditData({ ...editData, phoneNumber: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button onClick={handleSaveChanges} disabled={saving}>
                {saving ? (
                  <Loader className="animate-spin size-4" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
