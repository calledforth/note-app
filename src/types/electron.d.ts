// ============================================================================
// ELECTRON API TYPE DEFINITIONS
// Single source of truth for the electronAPI interface
// ============================================================================

import type { LayoutNode } from './bento';

// Workspace and Note types for the API
interface ApiWorkspace {
    id: string;
    name: string;
    layout: LayoutNode;
    createdAt: number;
    updatedAt: number;
}

interface ApiNote {
    id: string;
    workspaceId: string;
    panelId: string | null;
    title: string;
    content: string;
    borderHidden?: boolean;
    createdAt: number;
    updatedAt: number;
}

// Update info type
interface UpdateInfo {
    version: string;
}

// Extend the Window interface with our electron API
declare global {
    interface Window {
        electronAPI?: {
            platform: string;

            // Window controls
            windowControls: {
                minimize: () => Promise<void>;
                maximize: () => Promise<void>;
                close: () => Promise<void>;
                isMaximized: () => Promise<boolean>;
            };

            // Database operations
            database: {
                // Workspace operations
                getAllWorkspaces: () => Promise<ApiWorkspace[]>;
                getWorkspace: (id: string) => Promise<ApiWorkspace | null>;
                createWorkspace: (workspace: ApiWorkspace) => Promise<{ success: boolean }>;
                updateWorkspace: (id: string, updates: Partial<ApiWorkspace>) => Promise<{ success: boolean }>;
                deleteWorkspace: (id: string) => Promise<{ success: boolean }>;

                // Note operations
                getNotesForWorkspace: (workspaceId: string) => Promise<ApiNote[]>;
                createNote: (note: ApiNote) => Promise<{ success: boolean }>;
                updateNote: (id: string, updates: Partial<ApiNote>) => Promise<{ success: boolean }>;
                deleteNote: (id: string) => Promise<{ success: boolean }>;

                // App Settings
                getLastWorkspaceId: () => Promise<string | null>;
                setLastWorkspaceId: (workspaceId: string) => Promise<{ success: boolean }>;
            };

            // Database readiness
            databaseStatus: {
                isReady: () => Promise<boolean>;
                onReady: (callback: () => void) => () => void;
            };

            // Settings storage (electron-store)
            settings: {
                get: (key: string) => Promise<string | null>;
                set: (key: string, value: string) => Promise<{ success: boolean }>;
                delete: (key: string) => Promise<{ success: boolean }>;
            };

            // Todo workspace operations
            todo: {
                getSections: () => Promise<{ id: string; title: string; sortOrder: number; archived: boolean; createdAt: number }[]>;
                getItems: (sectionId: string) => Promise<{ id: string; sectionId: string; text: string; completed: boolean; daily: boolean; completedAt?: string | null; sortOrder: number; createdAt: number }[]>;
                createSection: (section: { id: string; title: string; sortOrder: number; archived: boolean; createdAt: number }) => Promise<{ success: boolean }>;
                updateSection: (id: string, updates: { title?: string; sortOrder?: number; archived?: boolean }) => Promise<{ success: boolean }>;
                deleteSection: (id: string) => Promise<{ success: boolean }>;
                createItem: (item: { id: string; sectionId: string; text: string; completed: boolean; daily: boolean; completedAt?: string | null; sortOrder: number; createdAt: number }) => Promise<{ success: boolean }>;
                updateItem: (id: string, updates: { text?: string; completed?: boolean; daily?: boolean; completedAt?: string | null; sortOrder?: number }) => Promise<{ success: boolean }>;
                deleteItem: (id: string) => Promise<{ success: boolean }>;
                getHistory: (dateKey: string) => Promise<{ todoId: string; text: string; completed: boolean; sectionTitle: string }[]>;
                getAllHistory: () => Promise<{ date: string; items: unknown[] }[]>;
                saveHistory: (dateKey: string, items: unknown[]) => Promise<{ success: boolean }>;
            };

            // Auto-updater
            updater: {
                // Actions
                checkForUpdates: () => Promise<void>;
                downloadUpdate: () => Promise<void>;
                quitAndInstall: () => Promise<void>;

                // Event listeners
                onCheckingForUpdate: (callback: () => void) => void;
                onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
                onUpdateNotAvailable: (callback: () => void) => void;
                onDownloadProgress: (callback: (percent: number) => void) => void;
                onUpdateDownloaded: (callback: () => void) => void;
                onError: (callback: (error: string) => void) => void;
            };
        };
    }
}

export { };
