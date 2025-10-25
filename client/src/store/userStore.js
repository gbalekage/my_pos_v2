import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setUser: (user, token) => set({ user, token }),
      clearUser: () => set({ user: null, token: null }),
    }),
    {
      name: "user-storage",
      getStorage: () => ({
        getItem: (name) => {
          const data = window.electronAPI.electronStore.get(name);
          return data ? JSON.stringify(data) : null;
        },
        setItem: (name, value) => {
          window.electronAPI.electronStore.set(name, JSON.parse(value));
        },
        removeItem: (name) => {
          window.electronAPI.electronStore.delete(name);
        },
      }),
    }
  )
);
