import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { database } from './database';
import { autoUpdater } from 'electron-updater';

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ============================================================================
// WINDOW CREATION
// ============================================================================

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Read saved window dimensions from database (defaults: 1000x700)
  const savedWidth = database.getSetting('windowWidth');
  const savedHeight = database.getSetting('windowHeight');
  const windowWidth = savedWidth ? parseInt(savedWidth, 10) : 1000;
  const windowHeight = savedHeight ? parseInt(savedHeight, 10) : 700;

  mainWindow = new BrowserWindow({
    height: windowHeight,
    width: windowWidth,
    backgroundColor: '#171717',
    frame: false,
    titleBarStyle: 'hidden',
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

  // Save window dimensions when closing
  mainWindow.on('close', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize();
      database.setSetting('windowWidth', width.toString());
      database.setSetting('windowHeight', height.toString());
    }
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
  return database.getLastWorkspaceId();
});

ipcMain.handle('db-set-last-workspace-id', (_event, workspaceId: string) => {
  database.setLastWorkspaceId(workspaceId);
  return { success: true };
});

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.on('ready', () => {
  // Initialize database before creating window
  database.initialize();
  createWindow();

  // Check for updates (only in production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    database.close();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  database.close();
});
