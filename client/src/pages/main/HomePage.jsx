import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import clsx from "clsx";
import { toast } from "sonner";
import { Loader, X, Keyboard, ClosedCaption } from "lucide-react"; // added Keyboard icon

import { useUserStore } from "@/store/userStore";
import OnScreenKeyboard from "@/components/main/OnScreenKeyboard";
import { ThemeButton } from "@/components/global/theme-btn";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const inputRef = useRef(null);
  const keyboardRef = useRef(null);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/users", { withCredentials: true });
      setUsers(res.data.users || []);
    } catch (error) {
      console.log("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleColor = (role) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "bg-green-100/40 dark:text-black";
      case "MANAGER":
        return "bg-yellow-100";
      case "CASHIER":
        return "bg-blue-100";
      default:
        return "";
    }
  };

  const handleCardClick = (user) => {
    setSelectedUser(user);
    setShowLogin(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.warning("Please enter your password.");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await axios.post(
        "/api/users/login-user",
        {
          username: selectedUser.username,
          password,
        },
        { withCredentials: true }
      );

      const { user, token } = res.data;
      setUser(user, token);

      toast.success(`Welcome, ${user.username}!`);
      setShowLogin(false);
      setPassword("");

      // Navigate based on role
      switch (user.role?.toUpperCase()) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "MANAGER":
          navigate("/manager/dashboard");
          break;
        case "CASHIER":
          navigate("/cashier/dashboard");
          break;
        case "ATTENDANT":
          navigate("/attendant/dashboard");
          break;
        default:
          navigate("/");
          break;
      }
    } catch (error) {
      console.log("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  // Automatically focus input when popup opens
  useEffect(() => {
    if (showLogin && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showLogin]);

  // Close keyboard when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        keyboardRef.current &&
        !keyboardRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowKeyboard(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close popup when pressing Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowLogin(false);
        setPassword("");
        setShowKeyboard(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">MYPOS</h1>
        <ThemeButton />
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <p className="text-muted-foreground">No user found.</p>
          <Button variant="outline" onClick={() => navigate("/setup")}>
            Create first user
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map((user) => (
            <Card
              key={user.id}
              onClick={() => handleCardClick(user)}
              className={clsx(
                "flex items-center justify-center hover:shadow-lg transition-all cursor-pointer w-full h-40",
                getRoleColor(user.role)
              )}
            >
              <CardHeader className="flex items-center justify-center p-0">
                <CardTitle className="text-center text-lg font-medium tracking-tighter">
                  {user.name}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Login panel */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <form
            onSubmit={handleLogin}
            className="p-6 rounded-md w-full max-w-sm relative shadow-xl"
          >
            {/* Close popup button */}
            <button
              type="button" // ✅ prevents form submission
              onClick={() => {
                setShowLogin(false);
                setPassword("");
                setShowKeyboard(false);
              }}
              className="absolute top-3 right-3 transition"
            >
              <X size={22} />
            </button>

            <h2 className="text-lg font-semibold mb-2">Login</h2>
            <p className="mb-4">
              Enter the password for <strong>{selectedUser?.username}</strong>
            </p>

            <div className="relative">
              <Input
                ref={inputRef}
                type="password"
                placeholder="Enter password or PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-lg tracking-widest"
                // onFocus={() => setShowKeyboard(true)}
              />

              {/* Button to open keyboard manually */}
              <button
                onClick={() => setShowKeyboard((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                <Keyboard size={20} />
              </button>

              {/* Floating Keyboard */}
              {showKeyboard && (
                <div
                  ref={keyboardRef}
                  className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border rounded-md shadow-lg p-4"
                >
                  {/* Close icon */}
                  <button
                    onClick={() => setShowKeyboard(false)}
                    className="absolute top-2 left-2 text-gray-500 hover:text-gray-700 transition"
                  >
                    <X size={20} />
                  </button>

                  <OnScreenKeyboard
                    onKeyPress={(key) => {
                      if (key === "BACKSPACE")
                        setPassword((prev) => prev.slice(0, -1));
                      else if (key === "ENTER") handleLogin();
                      else setPassword((prev) => prev + key);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button disabled={loginLoading} className="w-full" type="submit">
                {loginLoading ? (
                  <Loader className="animate-spin size-4" />
                ) : (
                  "Login"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HomePage;
