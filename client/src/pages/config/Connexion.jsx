import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const Connection = () => {
  const [loading, setLoading] = useState(false);

  const handleRetry = async (e) => {
    e.preventDefault();
    setLoading(true);

    const handler = (_, status) => {
      setLoading(false);
      if (status) {
        toast.success("Connection successful!");
      } else {
        toast.error("Failed to connect to the server.");
      }
      window.electronAPI.ipcRenderer.removeListener(
        "connection-status",
        handler
      );
    };

    window.electronAPI.ipcRenderer.on("connection-status", handler);
    window.electronAPI.ipcRenderer.send("retry-connection");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Server Connection
        </h2>
        <p className="mb-6 text-center text-muted-foreground">
          Unable to connect to the server.
          <br />
          Please check your network connection or contact the administrator.
        </p>
        <form onSubmit={handleRetry} className="flex flex-col gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin size-4" />
              </div>
            ) : (
              "Retry"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Connection;
