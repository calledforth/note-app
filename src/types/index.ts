export type SpaceMode = 'freeform' | 'grid' | 'bento';

export interface FreeformPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Note {
  id: string;
  spaceId: string;
  title?: string; // Note title
  content: string; // Rich text HTML
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Space {
  id: string;
  name: string;
  mode: SpaceMode;
  createdAt: number;
  updatedAt: number;
}

export interface Theme {
  fontFamily: string; // Default: 'Inter'
}

export interface NotesState {
  spaces: Space[];
  notes: Note[];
  currentSpaceId: string | null;
  theme: Theme;
  freeformPositions: Record<string, FreeformPosition>;
  gridPositions: Record<string, GridPosition>;
}

