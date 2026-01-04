import { create } from 'zustand';
import type { BentoWorkspace, BentoNote, LayoutNode } from '../types/bento';
import { DEFAULT_LAYOUT, generateId, findFirstEmptyPanel } from '../types/bento';
import '../types/electron.d';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface BentoStore {
    // State
    workspaces: BentoWorkspace[];
    currentWorkspaceId: string | null;
    notes: BentoNote[]; // Notes for the current workspace
    isLoading: boolean;
    isInitialized: boolean;

    // Computed
    currentWorkspace: () => BentoWorkspace | null;

    // Initialization
    initialize: () => Promise<void>;

    // Workspace actions
    createWorkspace: (name: string) => Promise<string>; // Returns new workspace ID
    deleteWorkspace: (id: string) => Promise<void>;
    switchWorkspace: (id: string) => Promise<void>;
    updateWorkspaceName: (id: string, name: string) => Promise<void>;
    updateWorkspaceLayout: (id: string, layout: LayoutNode) => Promise<void>;

    // Note actions
    createNote: () => Promise<string | null>; // Returns new note ID or null if no space
    updateNoteContent: (id: string, content: string) => Promise<void>;
    updateNoteTitle: (id: string, title: string) => Promise<void>;
    updateNotePanelId: (id: string, panelId: string | null) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useBentoStore = create<BentoStore>((set, get) => ({
    // Initial state
    workspaces: [],
    currentWorkspaceId: null,
    notes: [],
    isLoading: true,
    isInitialized: false,

    // Computed: get current workspace
    currentWorkspace: () => {
        const { workspaces, currentWorkspaceId } = get();
        return workspaces.find(w => w.id === currentWorkspaceId) || null;
    },

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        try {
            const db = window.electronAPI?.database;
            if (!db) {
                console.error('[BentoStore] Database API not available');
                set({ isLoading: false });
                return;
            }

            // Load all workspaces
            const workspaces = await db.getAllWorkspaces();

            if (workspaces.length === 0) {
                // Create default workspace
                const now = Date.now();
                const defaultWorkspace: BentoWorkspace = {
                    id: generateId(),
                    name: 'My Workspace',
                    layout: DEFAULT_LAYOUT,
                    createdAt: now,
                    updatedAt: now,
                };

                await db.createWorkspace(defaultWorkspace);
                await db.setLastWorkspaceId(defaultWorkspace.id);

                set({
                    workspaces: [defaultWorkspace],
                    currentWorkspaceId: defaultWorkspace.id,
                    notes: [],
                    isLoading: false,
                    isInitialized: true,
                });
            } else {
                // Try to load the last used workspace, fallback to first
                const lastWorkspaceId = await db.getLastWorkspaceId();
                const targetWorkspace = lastWorkspaceId
                    ? workspaces.find(w => w.id === lastWorkspaceId) || workspaces[0]
                    : workspaces[0];

                const notes = await db.getNotesForWorkspace(targetWorkspace.id);

                set({
                    workspaces,
                    currentWorkspaceId: targetWorkspace.id,
                    notes,
                    isLoading: false,
                    isInitialized: true,
                });
            }
        } catch (error) {
            console.error('[BentoStore] Initialization error:', error);
            set({ isLoading: false });
        }
    },

    // ============================================================================
    // WORKSPACE ACTIONS
    // ============================================================================

    createWorkspace: async (name: string) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        const now = Date.now();
        const newWorkspace: BentoWorkspace = {
            id: generateId(),
            name,
            layout: DEFAULT_LAYOUT,
            createdAt: now,
            updatedAt: now,
        };

        await db.createWorkspace(newWorkspace);

        set(state => ({
            workspaces: [...state.workspaces, newWorkspace],
            currentWorkspaceId: newWorkspace.id,
            notes: [], // New workspace has no notes
        }));

        return newWorkspace.id;
    },

    deleteWorkspace: async (id: string) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        await db.deleteWorkspace(id);

        set(state => {
            const remainingWorkspaces = state.workspaces.filter(w => w.id !== id);
            const newCurrentId = state.currentWorkspaceId === id
                ? remainingWorkspaces[0]?.id || null
                : state.currentWorkspaceId;

            return {
                workspaces: remainingWorkspaces,
                currentWorkspaceId: newCurrentId,
                notes: newCurrentId === state.currentWorkspaceId ? state.notes : [],
            };
        });

        // If we switched workspace, reload notes
        const { currentWorkspaceId } = get();
        if (currentWorkspaceId) {
            const notes = await db.getNotesForWorkspace(currentWorkspaceId);
            set({ notes });
        }
    },

    switchWorkspace: async (id: string) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        if (get().currentWorkspaceId === id) return;

        set({ isLoading: true });

        try {
            const notes = await db.getNotesForWorkspace(id);

            // Save the last workspace ID for persistence
            await db.setLastWorkspaceId(id);

            set({
                currentWorkspaceId: id,
                notes,
                isLoading: false,
            });
        } catch (error) {
            console.error('[BentoStore] Switch workspace error:', error);
            set({ isLoading: false });
        }
    },

    updateWorkspaceName: async (id: string, name: string) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        await db.updateWorkspace(id, { name });

        set(state => ({
            workspaces: state.workspaces.map(w =>
                w.id === id ? { ...w, name, updatedAt: Date.now() } : w
            ),
        }));
    },

    updateWorkspaceLayout: async (id: string, layout: LayoutNode) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        await db.updateWorkspace(id, { layout });

        set(state => ({
            workspaces: state.workspaces.map(w =>
                w.id === id ? { ...w, layout, updatedAt: Date.now() } : w
            ),
        }));
    },

    // ============================================================================
    // NOTE ACTIONS
    // ============================================================================

    createNote: async () => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        const { currentWorkspaceId, notes } = get();
        const workspace = get().currentWorkspace();

        if (!currentWorkspaceId || !workspace) {
            console.error('[BentoStore] No current workspace');
            return null;
        }

        // Find first empty panel
        const panelId = findFirstEmptyPanel(workspace.layout, notes);

        if (!panelId) {
            console.warn('[BentoStore] No empty panels available');
            return null; // All panels are full
        }

        const now = Date.now();
        const newNote: BentoNote = {
            id: generateId(),
            workspaceId: currentWorkspaceId,
            panelId,
            title: 'Untitled',
            content: '',
            createdAt: now,
            updatedAt: now,
        };

        await db.createNote(newNote);

        set(state => ({
            notes: [...state.notes, newNote],
        }));

        return newNote.id;
    },

    updateNoteContent: async (id: string, content: string) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        await db.updateNote(id, { content });

        set(state => ({
            notes: state.notes.map(n =>
                n.id === id ? { ...n, content, updatedAt: Date.now() } : n
            ),
        }));
    },

    updateNoteTitle: async (id: string, title: string) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        await db.updateNote(id, { title });

        set(state => ({
            notes: state.notes.map(n =>
                n.id === id ? { ...n, title, updatedAt: Date.now() } : n
            ),
        }));
    },

    updateNotePanelId: async (id: string, panelId: string | null) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        await db.updateNote(id, { panelId });

        set(state => ({
            notes: state.notes.map(n =>
                n.id === id ? { ...n, panelId, updatedAt: Date.now() } : n
            ),
        }));
    },

    deleteNote: async (id: string) => {
        const db = window.electronAPI?.database;
        if (!db) throw new Error('Database not available');

        await db.deleteNote(id);

        set(state => ({
            notes: state.notes.filter(n => n.id !== id),
        }));
    },
}));
