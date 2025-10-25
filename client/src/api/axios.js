import axios from "axios";

let instance = axios.create({
  baseURL: "",
  timeout: 5000,
});

export async function initAxios() {
  try {
    const serverUrl = await window.electronAPI.ipcRenderer.invoke("get-server-url");

    if (serverUrl) {
      instance.defaults.baseURL = serverUrl.replace(/\/$/, "");
      console.log("Axios base URL set to:", instance.defaults.baseURL);
    }
  } catch (error) {
    console.error("Failed to initialize Axios:", error);
  }
}

export default instance;