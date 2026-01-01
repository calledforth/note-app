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
            };

            // Auto-updater
            updater: {
                // Actions
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
