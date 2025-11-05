const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Store = require("electron-store").default;
const { exec } = require("child_process");
const { Client } = require("pg");
const fs = require("fs");

const store = new Store();
let mainWindow;
let currentServer = null;

/**
 * Override console.log to send logs to renderer
 */
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("server-log", args.join(" "));
  }
};

/**
 * Create app window
 */
function createWindow(file, options = {}) {
  mainWindow = new BrowserWindow({
    width: options.width || 600,
    height: options.height || 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, file));
}

/**
 * Test PostgreSQL connection
 */
async function testDBConnection(config) {
  const client = new Client({
    host: config.host,
    port: Number(config.port),
    user: config.user,
    password: config.password,
    database: config.database,
  });

  try {
    await client.connect();
    await client.end();
    return true;
  } catch (err) {
    console.error("DB connection failed:", err.message);
    return false;
  }
}

/**
 * Update or create .env file
 */
function updateEnvFile(config) {
  try {
    const envPath = path.join(__dirname, ".env");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    const dbUrl = `DATABASE_URL="postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?schema=public"`;
    const regex = /^DATABASE_URL=.*$/m;

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, dbUrl);
    } else {
      if (envContent && !envContent.endsWith("\n")) envContent += "\n";
      envContent += dbUrl + "\n";
    }

    fs.writeFileSync(envPath, envContent, "utf-8");
    console.log(".env updated successfully at", envPath);
  } catch (err) {
    console.error("Failed to create/update .env:", err);
  }
}

/**
 * Generate Prisma client
 */
function generatePrismaClient() {
  return new Promise((resolve, reject) => {
    exec("npx prisma db push", (error, stdout, stderr) => {
      if (error) {
        console.error("Prisma generate failed:", stderr);
        reject(error);
      } else {
        console.log("Prisma client generated:", stdout);
        resolve(stdout);
      }
    });
  });
}

/**
 * Start Express server
 */
function startServer() {
  if (currentServer) {
    console.log("Server is already running.");
    return currentServer;
  }

  try {
    const appServer = require("./index"); // Express app export
    const PORT = 5000;

    currentServer = appServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });

    currentServer.on("error", (err) => {
      console.error("❌ Server error:", err.message);
    });

    return currentServer;
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    currentServer = null;
    return null;
  }
}

/**
 * Stop Express server
 */
async function stopServer() {
  return new Promise((resolve, reject) => {
    if (!currentServer) {
      console.log("No active server to stop.");
      return resolve();
    }

    console.log("🛑 Stopping server...");
    currentServer.close((err) => {
      if (err) {
        console.error("Failed to stop server:", err.message);
        return reject(err);
      }
      console.log("✅ Server stopped successfully.");
      currentServer = null;
      resolve();
    });
  });
}

/**
 * App ready
 */
app.whenReady().then(() => {
  const config = store.get("serverConfig");
  if (!config) {
    createWindow("db-config.html", { width: 500, height: 500 });
  } else {
    createWindow("server-status.html", { width: 800, height: 600 });
    startServer();
  }
});

/**
 * Quit app when all windows are closed
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/**
 * IPC handlers
 */
ipcMain.handle("restart-server", async () => {
  try {
    console.log("🔄 Restarting server...");
    await stopServer();
    currentServer = startServer();
    return { success: true };
  } catch (err) {
    console.error("Failed to restart server:", err.message);
    return { success: false, message: err.message };
  }
});

ipcMain.handle("save-db-config", async (event, config) => {
  const isConnected = await testDBConnection(config);
  if (!isConnected) {
    return {
      success: false,
      message: "Cannot connect to database. Check credentials.",
    };
  }

  store.set("serverConfig", config);
  updateEnvFile(config);

  try {
    await generatePrismaClient();
  } catch (err) {
    return { success: false, message: "Prisma generation failed." };
  }

  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, "server-status.html"));
    mainWindow.setSize(800, 600);
  }

  startServer();
  return { success: true };
});

ipcMain.handle("get-db-config", async () => {
  return store.get("serverConfig");
});
