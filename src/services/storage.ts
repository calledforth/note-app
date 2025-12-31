import type { Space, Note, FreeformPosition, GridPosition, Theme } from '../types';

/**
 * Storage service interface for abstraction
 * This allows easy migration from localStorage to SQLite in the future
 */
export interface StorageService {
  // Spaces
  getSpaces: () => Promise<Space[]>;
  saveSpace: (space: Space) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;

  // Notes
  getNotes: () => Promise<Note[]>;
  saveNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Positions
  getFreeformPositions: () => Promise<Record<string, FreeformPosition>>;
  saveFreeformPosition: (noteId: string, position: FreeformPosition) => Promise<void>;

  getGridPositions: () => Promise<Record<string, GridPosition>>;
  saveGridPosition: (noteId: string, position: GridPosition) => Promise<void>;

  // Theme
  getTheme: () => Promise<Theme>;
  saveTheme: (theme: Theme) => Promise<void>;

  // Current space
  getCurrentSpaceId: () => Promise<string | null>;
  saveCurrentSpaceId: (id: string | null) => Promise<void>;
}

/**
 * LocalStorage implementation using Zustand persistence
 * This is a placeholder that matches the interface
 * Actual persistence is handled by Zustand's persist middleware
 */
export class LocalStorageService implements StorageService {
  async getSpaces(): Promise<Space[]> {
    // Zustand handles this via persist middleware
    return [];
  }

  async saveSpace(_space: Space): Promise<void> {
    // Zustand handles this via persist middleware
  }

  async deleteSpace(_id: string): Promise<void> {
    // Zustand handles this via persist middleware
  }

  async getNotes(): Promise<Note[]> {
    return [];
  }

  async saveNote(_note: Note): Promise<void> {
    // Zustand handles this via persist middleware
  }

  async deleteNote(_id: string): Promise<void> {
    // Zustand handles this via persist middleware
  }

  async getFreeformPositions(): Promise<Record<string, FreeformPosition>> {
    return {};
  }

  async saveFreeformPosition(_noteId: string, _position: FreeformPosition): Promise<void> {
    // Zustand handles this via persist middleware
  }

  async getGridPositions(): Promise<Record<string, GridPosition>> {
    return {};
  }

  async saveGridPosition(_noteId: string, _position: GridPosition): Promise<void> {
    // Zustand handles this via persist middleware
  }

  async getTheme(): Promise<Theme> {
    return { fontFamily: 'Inter' };
  }

  async saveTheme(_theme: Theme): Promise<void> {
    // Zustand handles this via persist middleware
  }

  async getCurrentSpaceId(): Promise<string | null> {
    return null;
  }

  async saveCurrentSpaceId(_id: string | null): Promise<void> {
    // Zustand handles this via persist middleware
  }
}

// Export singleton instance
export const storageService = new LocalStorageService();

