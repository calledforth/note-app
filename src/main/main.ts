import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { database } from './database';
import { autoUpdater } from 'electron-updater';

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ============================================================================
// AUTO-UPDATER SETUP
// ============================================================================

// Disable auto-download - we'll prompt user first
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Log for debugging
autoUpdater.logger = console;

autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdater] Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] Update available:', info.version);
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available. Would you like to download it now?`,
    buttons: ['Download', 'Later'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('[AutoUpdater] No updates available.');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`[AutoUpdater] Download progress: ${Math.round(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', () => {
  console.log('[AutoUpdater] Update downloaded.');
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The app will restart to install the update.',
    buttons: ['Restart Now', 'Later'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (error) => {
  console.error('[AutoUpdater] Error:', error);
});

// ============================================================================
// WINDOW CREATION
// ============================================================================

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 700,
    width: 1000,
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

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
