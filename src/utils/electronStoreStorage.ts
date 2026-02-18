import type { StateStorage } from 'zustand/middleware';

const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const electronStoreStorage: StateStorage = {
  getItem: async (name: string) => {
    const settings = window.electronAPI?.settings;
    if (settings) {
      const value = await settings.get(name);
      if (value !== null) return value;
    }

    const fallback = safeLocalStorage.getItem(name);
    if (fallback !== null && settings) {
      await settings.set(name, fallback);
      safeLocalStorage.removeItem(name);
    }
    return fallback;
  },
  setItem: async (name: string, value: string) => {
    const settings = window.electronAPI?.settings;
    if (settings) {
      await settings.set(name, value);
      safeLocalStorage.removeItem(name);
      return;
    }
    safeLocalStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    const settings = window.electronAPI?.settings;
    if (settings) {
      await settings.delete(name);
    }
    safeLocalStorage.removeItem(name);
  },
};
