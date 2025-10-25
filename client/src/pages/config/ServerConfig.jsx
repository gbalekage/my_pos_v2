import { ThemeButton } from "@/components/global/theme-btn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Loader } from "lucide-react";
import React, { useState } from "react";

const ServerConfig = () => {
  const [checked, setChecked] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!serverUrl) return;
    setLoading(true);
    setServerStatus(null);

    try {
      const response = await axios.get(
        `${serverUrl.replace(/\/$/, "")}/api/health`,
        {
          timeout: 5000,
        }
      );

      if (response.data?.status === "ok") {
        setServerStatus("on");
        setChecked(true); // Enable saving
      } else {
        setServerStatus("off");
      }
    } catch (error) {
      console.error("Server check failed:", error);
      setServerStatus("off");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!serverUrl) return;

    setLoading(true);

    try {
      await window.electronAPI.ipcRenderer.send("save-config", serverUrl);
      setSuccess(true);
      setServerStatus("on");
    } catch (error) {
      console.error("Failed to save server URL:", error);
      setServerStatus("off");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
      {/* ThemeButton centered above the card */}
      <div className="flex justify-center w-full">
        <ThemeButton />
      </div>

      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle>Server Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={checked ? handleSave : handleCheck}
            className="space-y-4"
          >
            <div>
              <label htmlFor="server-url" className="block mb-1 font-medium">
                Server URL
              </label>
              <Input
                id="server-url"
                type="text"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setChecked(false);
                  setServerStatus(null);
                }}
                className={"text-xs"}
                placeholder="e.g. http://localhost:3000"
                required
                disabled={loading || success}
              />
            </div>
            {!checked ? (
              <Button
                type="submit"
                className="w-full text-xs"
                disabled={loading || !serverUrl}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="animate-spin size-4" />
                  </div>
                ) : (
                  "Check Server"
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full"
                disabled={success || loading || !serverUrl}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="animate-spin size-4" />
                  </div>
                ) : (
                  "Save"
                )}
              </Button>
            )}
            {serverStatus === "on" && (
              <div className="text-green-600 text-center mt-2">
                ✅ Server is online
              </div>
            )}
            {serverStatus === "off" && (
              <div className="text-red-600 text-center mt-2">
                Server is offline
              </div>
            )}
            {success && (
              <div className="text-green-600 text-center mt-2">
                Configuration saved!
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
          <div className="font-semibold text-xs text-muted-foreground">
            @MYPOS {new Date().getFullYear()} V.2.0
          </div>
          <div className="flex sm:flex-row sm:gap-4 gap-2 mt-1">
            <p className="text-[10px]">
              Email:{" "}
              <a
                href="mailto:gbalekage21@gmail.com"
                className="hover:underline text-[10px]"
              >
                gbalekage21@gmail.com
              </a>
            </p>
            <p className="text-[10px]">
              Phone:{" "}
              <a
                href="tel:+243856485215"
                className="hover:underline text-[10px]"
              >
                +243 856 485 215
              </a>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ServerConfig;
