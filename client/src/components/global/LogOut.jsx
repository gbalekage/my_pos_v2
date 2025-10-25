import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";

export const LogoutButton = () => {
  const navigate = useNavigate();
  const { user, clearUser } = useUserStore();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    clearUser();
    navigate("/"); // redirect to login page
  };

  return (
    <Button
      onClick={handleLogout}
      variant="destructive"
      className="font-medium"
    >
      Logout
    </Button>
  );
};
