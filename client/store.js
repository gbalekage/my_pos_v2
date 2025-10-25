import Store from "electron-store";

const store = new Store();

export const getServerUrl = () => store.get("serverUrl");
export const setServerUrl = (url) => store.set("serverUrl", url);
export const clearServerUrl = () => store.delete("serverUrl");
