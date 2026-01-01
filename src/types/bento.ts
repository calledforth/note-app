// ============================================================================
// BENTO WORKSPACE TYPES
// ============================================================================

// Layout Node Types - defines the panel tree structure
export type LayoutType = 'container' | 'pane';
export type LayoutDirection = 'horizontal' | 'vertical';

export interface LayoutNode {
    id: string;
    type: LayoutType;
    direction?: LayoutDirection; // For containers
    children?: LayoutNode[]; // For containers
    defaultSize?: number; // Panel size percentage
    panelId?: string; // For panes - the unique ID of this panel slot
}

// Workspace - a collection of notes with a specific layout
export interface BentoWorkspace {
    id: string;
    name: string;
    layout: LayoutNode;
    createdAt: number;
    updatedAt: number;
}

// Note - a single sticky note
export interface BentoNote {
    id: string;
    workspaceId: string;
    panelId: string | null; // Which panel this note is in (null if not placed)
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

// ============================================================================
// DEFAULT LAYOUT - 2x2 Grid
// ============================================================================

export const DEFAULT_LAYOUT: LayoutNode = {
    id: 'root',
    type: 'container',
    direction: 'horizontal',
    children: [
        {
            id: 'col-1',
            type: 'container',
            direction: 'vertical',
            defaultSize: 50,
            children: [
                { id: 'pane-1-1', type: 'pane', panelId: 'p-1-1', defaultSize: 50 },
                { id: 'pane-1-2', type: 'pane', panelId: 'p-1-2', defaultSize: 50 },
            ],
        },
        {
            id: 'col-2',
            type: 'container',
            direction: 'vertical',
            defaultSize: 50,
            children: [
                { id: 'pane-2-1', type: 'pane', panelId: 'p-2-1', defaultSize: 50 },
                { id: 'pane-2-2', type: 'pane', panelId: 'p-2-2', defaultSize: 50 },
            ],
        },
    ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate a unique ID
export const generateId = (): string =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Get all panel IDs from a layout tree
export const getAllPanelIds = (node: LayoutNode): string[] => {
    if (node.type === 'pane' && node.panelId) {
        return [node.panelId];
    }
    if (node.children) {
        return node.children.flatMap(getAllPanelIds);
    }
    return [];
};

// Find the first empty panel in a layout given the current notes
export const findFirstEmptyPanel = (
    layout: LayoutNode,
    notes: BentoNote[]
): string | null => {
    const allPanelIds = getAllPanelIds(layout);
    const occupiedPanelIds = new Set(notes.map(n => n.panelId).filter(Boolean));

    for (const panelId of allPanelIds) {
        if (!occupiedPanelIds.has(panelId)) {
            return panelId;
        }
    }

    return null; // All panels are occupied
};
