import type { FreeformPosition, GridPosition } from '../types';

// Fixed grid cell size in pixels
export const GRID_CELL_SIZE = 50;

// Default note size in grid units (9x5 = 425px x 225px)
export const DEFAULT_NOTE_GRID_SIZE = { w: 9, h: 5 };

/**
 * Convert freeform pixel position to grid units
 */
export function freeformToGrid(freeform: FreeformPosition): GridPosition {
  return {
    x: Math.floor(freeform.x / GRID_CELL_SIZE),
    y: Math.floor(freeform.y / GRID_CELL_SIZE),
    w: Math.max(1, Math.ceil(freeform.width / GRID_CELL_SIZE)),
    h: Math.max(1, Math.ceil(freeform.height / GRID_CELL_SIZE)),
  };
}

/**
 * Convert grid units to freeform pixel position
 */
export function gridToFreeform(grid: GridPosition): FreeformPosition {
  return {
    x: grid.x * GRID_CELL_SIZE,
    y: grid.y * GRID_CELL_SIZE,
    width: grid.w * GRID_CELL_SIZE,
    height: grid.h * GRID_CELL_SIZE,
    zIndex: 0, // Not used in grid mode
  };
}

/**
 * Get default freeform position (center of viewport)
 * Square/vertical rectangle - narrow width, taller height
 */
export function getDefaultFreeformPosition(
  viewportWidth: number = 1200,
  viewportHeight: number = 800
): FreeformPosition {
  const defaultWidth = 280; // Narrow width for square/vertical rectangle
  const defaultHeight = 400; // Taller height
  
  return {
    x: (viewportWidth - defaultWidth) / 2,
    y: (viewportHeight - defaultHeight) / 2,
    width: defaultWidth,
    height: defaultHeight,
    zIndex: 0,
  };
}

/**
 * Get default grid position (next available cell)
 * Uses y: Infinity for vertical compaction
 */
export function getDefaultGridPosition(
  existingLayout: GridPosition[] = []
): GridPosition {
  // Find the bottommost row
  const maxY = existingLayout.reduce((max, pos) => Math.max(max, pos.y + pos.h), -1);
  
  return {
    x: 0,
    y: maxY + 1,
    w: DEFAULT_NOTE_GRID_SIZE.w,
    h: DEFAULT_NOTE_GRID_SIZE.h,
  };
}

/**
 * Convert all notes from one mode to another
 */
export function convertAllNotes(
  notes: Array<{ id: string }>,
  fromMode: 'freeform' | 'grid',
  toMode: 'freeform' | 'grid',
  freeformPositions: Record<string, FreeformPosition>,
  gridPositions: Record<string, GridPosition>
): {
  freeformPositions: Record<string, FreeformPosition>;
  gridPositions: Record<string, GridPosition>;
} {
  const newFreeformPositions = { ...freeformPositions };
  const newGridPositions = { ...gridPositions };

  notes.forEach((note) => {
    if (fromMode === 'freeform' && toMode === 'grid') {
      // Convert freeform → grid
      const freeformPos = freeformPositions[note.id];
      if (freeformPos) {
        newGridPositions[note.id] = freeformToGrid(freeformPos);
      }
    } else if (fromMode === 'grid' && toMode === 'freeform') {
      // Convert grid → freeform
      const gridPos = gridPositions[note.id];
      if (gridPos) {
        newFreeformPositions[note.id] = gridToFreeform(gridPos);
      }
    }
  });

  return {
    freeformPositions: newFreeformPositions,
    gridPositions: newGridPositions,
  };
}

