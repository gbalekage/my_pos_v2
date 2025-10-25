import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Building, Pen, Printer, ShoppingBag, Users } from "lucide-react";

import { NavMain } from "@/components/admin/nav-main";
import { NavUser } from "@/components/admin/nav-user";
import { TeamSwitcher } from "@/components/admin/team-switcher";
import DefaultAvatar from "@/assets/default avatar.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import axios from "axios";
import { useUserStore } from "@/store/userStore";

export function AppSidebar({ ...props }) {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [company, setCompany] = React.useState(null);
  const [loadingCompany, setLoadingCompany] = React.useState(true);

  // Redirect to login if no user
  React.useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const fetchCompany = async () => {
    setLoadingCompany(true);
    try {
      const res = await axios.get("/api/company");
      setCompany(res.data.company);
    } catch (error) {
      console.error("Error getting company:", error);
    } finally {
      setLoadingCompany(false);
    }
  };

  React.useEffect(() => {
    fetchCompany();
  }, []);

  if (!user || loadingCompany) return null;

  const data = {
    user: {
      name: user.name || "Unknown User",
      email: user.email || "No email",
    },
    teams: {
      name: company?.name || "Loading...",
      logo: company?.logoUrl || DefaultAvatar,
      plan: company?.email || "",
    },
    navMain: [
      {
        title: "Users",
        url: "#",
        icon: Users,
        isActive: false,
        items: [
          { title: "Users List", url: "/admin/users/list" },
          { title: "Add User", url: "/admin/users/add" },
        ],
      },
      {
        title: "Printers",
        url: "#",
        icon: Printer,
        isActive: false,
        items: [
          { title: "Printer List", url: "/admin/printers/list" },
          { title: "Add Printer", url: "/admin/printers/add" },
        ],
      },
      {
        title: "Stores",
        url: "#",
        icon: ShoppingBag,
        isActive: false,
        items: [
          { title: "Stores List", url: "/admin/stores/list" },
          { title: "Add Store", url: "/admin/stores/add" },
        ],
      },
      {
        title: "Categories",
        url: "#",
        icon: Pen,
        isActive: false,
        items: [
          { title: "Categories List", url: "/admin/categories/list" },
          { title: "Add Category", url: "/admin/categories/add" },
        ],
      },
      {
        title: "Items",
        url: "#",
        icon: ShoppingBag, // or any other icon
        isActive: false,
        items: [
          { title: "Items List", url: "/admin/items/list" },
          { title: "Add Item", url: "/admin/items/add" },
        ],
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
