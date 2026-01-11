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
    borderHidden?: boolean; // User override: hide border for this note's panel
    createdAt: number;
    updatedAt: number;
}

// ============================================================================
// DEFAULT LAYOUT - Single Panel (Notion-like clean start)
// ============================================================================

export const DEFAULT_LAYOUT: LayoutNode = {
    id: 'root',
    type: 'pane',
    panelId: 'p-main',
    defaultSize: 100,
};

// ============================================================================
// BORDER VISIBILITY COMPUTATION
// Pre-computes which panels should show borders (optimized - runs once)
// ============================================================================

/**
 * Computes which panels should show borders based on layout structure.
 * 
 * RULE: "Multiple Panels = Borders"
 * - Any panel that shares a container with siblings gets borders
 * - Single panel = NO borders (clean, focused writing)
 * - User can override per-panel via borderHidden property
 * 
 * @param layout - The root layout node
 * @returns Set of panelIds that should display borders by default
 */
export const computeBorderVisibility = (layout: LayoutNode): Set<string> => {
    const borderedPanels = new Set<string>();

    const traverse = (node: LayoutNode, parentHasMultipleChildren: boolean): void => {
        if (node.type === 'pane') {
            // If parent container has multiple children, this panel needs borders
            if (parentHasMultipleChildren && node.panelId) {
                borderedPanels.add(node.panelId);
            }
            return;
        }

        // It's a container - check if it has multiple children
        const hasMultipleChildren = (node.children?.length ?? 0) > 1;

        for (const child of node.children ?? []) {
            traverse(child, hasMultipleChildren);
        }
    };

    traverse(layout, false); // Root starts with no parent siblings
    return borderedPanels;
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
