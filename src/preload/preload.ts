import { contextBridge, ipcRenderer } from 'electron';

// Types for database operations
interface Workspace {
  id: string;
  name: string;
  layout: unknown;
  createdAt: number;
  updatedAt: number;
}

interface Note {
  id: string;
  workspaceId: string;
  panelId: string | null;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// Update info type
interface UpdateInfo {
  version: string;
}

// Expose protected methods that allow the renderer process to use the APIs we need
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Window controls
  windowControls: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },

  // Database operations
  database: {
    // Workspace operations
    getAllWorkspaces: (): Promise<Workspace[]> =>
      ipcRenderer.invoke('db-get-all-workspaces'),

    getWorkspace: (id: string): Promise<Workspace | null> =>
      ipcRenderer.invoke('db-get-workspace', id),

    createWorkspace: (workspace: Workspace): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db-create-workspace', workspace),

    updateWorkspace: (id: string, updates: Partial<Workspace>): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db-update-workspace', id, updates),

    deleteWorkspace: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db-delete-workspace', id),

    // Note operations
    getNotesForWorkspace: (workspaceId: string): Promise<Note[]> =>
      ipcRenderer.invoke('db-get-notes-for-workspace', workspaceId),

    createNote: (note: Note): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db-create-note', note),

    updateNote: (id: string, updates: Partial<Note>): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db-update-note', id, updates),

    deleteNote: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db-delete-note', id),
  },

  // Auto-updater events
  updater: {
    // Actions
    downloadUpdate: () => ipcRenderer.invoke('updater-download'),
    quitAndInstall: () => ipcRenderer.invoke('updater-quit-and-install'),

    // Event listeners
    onCheckingForUpdate: (callback: () => void) => {
      ipcRenderer.on('updater-checking', callback);
    },
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on('updater-available', (_event, info: UpdateInfo) => callback(info));
    },
    onUpdateNotAvailable: (callback: () => void) => {
      ipcRenderer.on('updater-not-available', callback);
    },
    onDownloadProgress: (callback: (percent: number) => void) => {
      ipcRenderer.on('updater-progress', (_event, percent: number) => callback(percent));
    },
    onUpdateDownloaded: (callback: () => void) => {
      ipcRenderer.on('updater-downloaded', callback);
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('updater-error', (_event, error: string) => callback(error));
    },
  },
});
