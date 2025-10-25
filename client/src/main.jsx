import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./components/global/theme-provider";
import axios from "axios";

async function initAxios() {
  try {
    const serverUrl = await window.electronAPI.ipcRenderer.invoke("get-server-url");

    if (!serverUrl) {
      console.error("Server URL not set in store");
      return;
    }

    axios.defaults.baseURL = serverUrl.replace(/\/$/, "");
    axios.defaults.timeout = 5000;
    console.log("Axios initialized with base URL:", axios.defaults.baseURL);
  } catch (error) {
    console.error("Failed to initialize Axios:", error);
  }
}

async function bootApp() {
  await initAxios();

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

bootApp();
