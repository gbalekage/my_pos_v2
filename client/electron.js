import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import path from "path";
import Store from "electron-store";
import axios from "axios";

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-features", "NetworkService"); 
app.commandLine.appendSwitch('disable-logging');

const store = new Store();

let mainWindow = null;
let configWindow = null;
let retryWindow = null;

const DEV_URL = "http://localhost:5173/";

// --------------------- Create Windows ---------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,
    frame: false,
    webPreferences: {
      preload: path.resolve("./preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(DEV_URL);
  mainWindow.webContents.openDevTools({ mode: "detach" });

  // Reload shortcut
  globalShortcut.register("CommandOrControl+R", () => {
    if (mainWindow) mainWindow.webContents.reload();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    globalShortcut.unregisterAll();
  });
}

function createConfigWindow() {
  configWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.resolve("./preload.js"),
      contextIsolation: true,
    },
  });

  configWindow.loadURL(DEV_URL + "config");
  configWindow.webContents.openDevTools({ mode: "detach" });
  configWindow.on("closed", () => (configWindow = null));
}

function createRetryWindow() {
  retryWindow = new BrowserWindow({
    width: 600,
    height: 400,
    // frame: false,
    // resizable: false,
    webPreferences: {
      preload: path.resolve("./preload.js"),
      contextIsolation: true,
    },
  });

  retryWindow.loadURL(DEV_URL + "retry");
  retryWindow.webContents.openDevTools({ mode: "detach" });
  retryWindow.on("closed", () => (retryWindow = null));
}

// --------------------- Test Server ---------------------
async function testServerConnection(url) {
  try {
    const healthUrl = `${url.replace(/\/$/, "")}/api/health`;
    await axios.get(healthUrl, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// --------------------- IPC Handlers ---------------------
ipcMain.handle("get-store-value", (event, key) => store.get(key));
ipcMain.handle("set-store-value", (event, { key, value }) => {
  store.set(key, value);
  return true;
});
ipcMain.handle("delete-store-key", (event, key) => {
  store.delete(key);
  return true;
});
ipcMain.handle("get-server-url", () => store.get("serverUrl"));

ipcMain.on("save-config", (event, url) => {
  store.set("serverUrl", url);
  if (configWindow) {
    configWindow.close();
    configWindow = null;
  }
  createMainWindow();
});

ipcMain.on("retry-connection", async (event) => {
  const serverUrl = store.get("serverUrl");
  const connected = await testServerConnection(serverUrl);
  event.sender.send("connection-status", connected);

  if (connected) {
    if (retryWindow) {
      retryWindow.close();
      retryWindow = null;
    }
    createMainWindow();
  }
});

ipcMain.handle("close-app", () => {
  app.quit();
});

// --------------------- App Lifecycle ---------------------
app.whenReady().then(async () => {
  const serverUrl = store.get("serverUrl");

  if (!serverUrl || serverUrl === "") {
    createConfigWindow();
  } else {
    const connected = await testServerConnection(serverUrl);
    if (connected) {
      createMainWindow();
    } else {
      createRetryWindow();
    }
  }
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
