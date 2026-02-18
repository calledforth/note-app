import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { database } from './database';
import { autoUpdater } from 'electron-updater';

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ============================================================================
// WINDOW CREATION
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let windowStateSaveTimer: NodeJS.Timeout | null = null;
let dbReady = false;
const settingsStore = new Store();

const isExternalHttpUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const saveWindowBounds = (immediate = false): void => {
  if (!mainWindow) return;

  const doSave = () => {
    if (!mainWindow) return;
    const isMaximized = mainWindow.isMaximized();
    const bounds = isMaximized ? mainWindow.getNormalBounds() : mainWindow.getBounds();
    try {
      settingsStore.set('windowBounds', {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized,
      });
    } catch (error) {
      console.error('[Settings] Failed to persist window settings:', error);
    }
  };

  if (immediate) {
    if (windowStateSaveTimer) {
      clearTimeout(windowStateSaveTimer);
      windowStateSaveTimer = null;
    }
    doSave();
    return;
  }

  if (windowStateSaveTimer) clearTimeout(windowStateSaveTimer);
  windowStateSaveTimer = setTimeout(() => {
    windowStateSaveTimer = null;
    doSave();
  }, 300);
};

const createWindow = (): void => {
  // Read saved window dimensions from settings (defaults: 1000x700)
  let windowWidth = 1000;
  let windowHeight = 700;
  let windowX: number | undefined;
  let windowY: number | undefined;
  let shouldMaximize = false;
  try {
    const savedBounds = settingsStore.get('windowBounds') as
      | { width?: number; height?: number; x?: number; y?: number; isMaximized?: boolean }
      | undefined;
    if (savedBounds?.width) windowWidth = savedBounds.width;
    if (savedBounds?.height) windowHeight = savedBounds.height;
    if (typeof savedBounds?.x === 'number') windowX = savedBounds.x;
    if (typeof savedBounds?.y === 'number') windowY = savedBounds.y;
    shouldMaximize = Boolean(savedBounds?.isMaximized);
  } catch (error) {
    console.error('[Settings] Failed to read window settings:', error);
  }
  const devIconPath = path.join(app.getAppPath(), 'src/assets/icon.ico');

  mainWindow = new BrowserWindow({
    height: windowHeight,
    width: windowWidth,
    x: windowX,
    y: windowY,
    backgroundColor: '#171717',
    frame: false,
    titleBarStyle: 'hidden',
    icon: isDev ? devIconPath : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  if (isDev) {
    // Development: load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (shouldMaximize) {
      mainWindow?.maximize();
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (dbReady) {
      sendToRenderer('db-ready');
    }
  });

  // Open external links in the default browser instead of new windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalHttpUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow?.webContents.getURL();
    if (currentUrl && url !== currentUrl && isExternalHttpUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Save window dimensions when closing
  mainWindow.on('close', () => {
    saveWindowBounds(true);
  });

  mainWindow.on('resize', () => {
    saveWindowBounds();
  });

  mainWindow.on('move', () => {
    saveWindowBounds();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Helper to send events to renderer
const sendToRenderer = (channel: string, ...args: unknown[]) => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send(channel, ...args);
  }
};

// ============================================================================
// AUTO-UPDATER SETUP
// ============================================================================

// Disable auto-download - we'll let user decide via the toast
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Log for debugging
autoUpdater.logger = console;

// Send events to renderer for the custom toast
autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdater] Checking for updates...');
  sendToRenderer('updater-checking');
});

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] Update available:', info.version);
  sendToRenderer('updater-available', { version: info.version });
});

autoUpdater.on('update-not-available', () => {
  console.log('[AutoUpdater] No updates available.');
  sendToRenderer('updater-not-available');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`[AutoUpdater] Download progress: ${Math.round(progress.percent)}%`);
  sendToRenderer('updater-progress', progress.percent);
});

autoUpdater.on('update-downloaded', () => {
  console.log('[AutoUpdater] Update downloaded.');
  sendToRenderer('updater-downloaded');
});

autoUpdater.on('error', (error) => {
  console.error('[AutoUpdater] Error:', error);
  sendToRenderer('updater-error', error.message);
});

// IPC handlers for updater actions
ipcMain.handle('updater-download', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('updater-quit-and-install', () => {
  // Save window dimensions BEFORE quitAndInstall triggers shutdown
  // This prevents the race condition where 'before-quit' closes the database
  // before the window 'close' event can save dimensions
  saveWindowBounds(true);
  autoUpdater.quitAndInstall(true, true);
});

// ============================================================================
// WINDOW CONTROL IPC HANDLERS
// ============================================================================

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// ============================================================================
// DATABASE IPC HANDLERS
// ============================================================================

// Workspace handlers
ipcMain.handle('db-get-all-workspaces', () => {
  return database.getAllWorkspaces();
});

ipcMain.handle('db-get-workspace', (_event, id: string) => {
  return database.getWorkspace(id);
});

ipcMain.handle('db-create-workspace', (_event, workspace) => {
  database.createWorkspace(workspace);
  return { success: true };
});

ipcMain.handle('db-update-workspace', (_event, id: string, updates) => {
  database.updateWorkspace(id, updates);
  return { success: true };
});

ipcMain.handle('db-delete-workspace', (_event, id: string) => {
  database.deleteWorkspace(id);
  return { success: true };
});

// Note handlers
ipcMain.handle('db-get-notes-for-workspace', (_event, workspaceId: string) => {
  return database.getNotesForWorkspace(workspaceId);
});

ipcMain.handle('db-create-note', (_event, note) => {
  database.createNote(note);
  return { success: true };
});

ipcMain.handle('db-update-note', (_event, id: string, updates) => {
  database.updateNote(id, updates);
  return { success: true };
});

ipcMain.handle('db-delete-note', (_event, id: string) => {
  database.deleteNote(id);
  return { success: true };
});

// App Settings handlers
ipcMain.handle('db-get-last-workspace-id', () => {
  const lastWorkspaceId = settingsStore.get('lastWorkspaceId');
  return typeof lastWorkspaceId === 'string' ? lastWorkspaceId : null;
});

ipcMain.handle('db-set-last-workspace-id', (_event, workspaceId: string) => {
  settingsStore.set('lastWorkspaceId', workspaceId);
  return { success: true };
});

// Settings storage
ipcMain.handle('settings-get', (_event, key: string) => {
  const value = settingsStore.get(key);
  return typeof value === 'string' ? value : null;
});

ipcMain.handle('settings-set', (_event, key: string, value: string) => {
  settingsStore.set(key, value);
  return { success: true };
});

ipcMain.handle('settings-delete', (_event, key: string) => {
  settingsStore.delete(key);
  return { success: true };
});

// Database readiness status
ipcMain.handle('db-is-ready', () => {
  return dbReady;
});

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.on('ready', () => {
  createWindow();

  setTimeout(() => {
    try {
      if (!dbReady) {
        database.initialize();
        dbReady = true;
        sendToRenderer('db-ready');
      }
    } catch (error) {
      console.error('[Database] Initialization failed:', error);
    }
  }, 0);

  // Check for updates (only in production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  database.close();
});
