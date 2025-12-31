import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotesState, Space, Note, SpaceMode, FreeformPosition, GridPosition } from '../types';

interface NotesStore extends NotesState {
  // Space actions
  addSpace: (name: string, mode: SpaceMode) => void;
  deleteSpace: (id: string) => void;
  switchSpace: (id: string) => void;
  updateSpace: (id: string, updates: Partial<Space>) => void;

  // Note actions
  addNote: (spaceId: string, content?: string) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Position actions
  updateNotePosition: (noteId: string, mode: SpaceMode, position: FreeformPosition | GridPosition) => void;

  // Mode switching
  switchMode: (spaceId: string, newMode: SpaceMode) => void;

  // Theme actions
  updateTheme: (fontFamily: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useNotesStore = create<NotesStore>()(
  persist(
    (set) => ({
      spaces: [],
      notes: [],
      currentSpaceId: null,
      theme: {
        fontFamily: 'Inter',
      },
      freeformPositions: {},
      gridPositions: {},

      addSpace: (name: string, mode: SpaceMode) => {
        const newSpace: Space = {
          id: generateId(),
          name,
          mode,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          spaces: [...state.spaces, newSpace],
          currentSpaceId: newSpace.id,
        }));
      },

      deleteSpace: (id: string) => {
        set((state) => {
          const newSpaces = state.spaces.filter((s) => s.id !== id);
          const newNotes = state.notes.filter((n) => n.spaceId !== id);
          const newFreeformPositions = { ...state.freeformPositions };
          const newGridPositions = { ...state.gridPositions };

          // Remove positions for deleted notes
          newNotes.forEach((note) => {
            delete newFreeformPositions[note.id];
            delete newGridPositions[note.id];
          });

          return {
            spaces: newSpaces,
            notes: newNotes,
            freeformPositions: newFreeformPositions,
            gridPositions: newGridPositions,
            currentSpaceId: newSpaces.length > 0 ? newSpaces[0].id : null,
          };
        });
      },

      switchSpace: (id: string) => {
        set({ currentSpaceId: id });
      },

      updateSpace: (id: string, updates: Partial<Space>) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === id
              ? { ...space, ...updates, updatedAt: Date.now() }
              : space
          ),
        }));
      },

      addNote: (spaceId: string, content: string = ''): string => {
        const newNote: Note = {
          id: generateId(),
          spaceId,
          title: 'untitled',
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          notes: [...state.notes, newNote],
        }));
        return newNote.id;
      },

      updateNote: (id: string, updates: Partial<Note>) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: Date.now() }
              : note
          ),
        }));
      },

      deleteNote: (id: string) => {
        set((state) => {
          const newFreeformPositions = { ...state.freeformPositions };
          const newGridPositions = { ...state.gridPositions };
          delete newFreeformPositions[id];
          delete newGridPositions[id];

          return {
            notes: state.notes.filter((n) => n.id !== id),
            freeformPositions: newFreeformPositions,
            gridPositions: newGridPositions,
          };
        });
      },

      updateNotePosition: (noteId: string, mode: SpaceMode, position: FreeformPosition | GridPosition) => {
        set((state) => {
          if (mode === 'freeform') {
            return {
              freeformPositions: {
                ...state.freeformPositions,
                [noteId]: position as FreeformPosition,
              },
            };
          } else {
            return {
              gridPositions: {
                ...state.gridPositions,
                [noteId]: position as GridPosition,
              },
            };
          }
        });
      },

      switchMode: (spaceId: string, newMode: SpaceMode) => {
        set((state) => {
          const updatedSpaces = state.spaces.map((space) =>
            space.id === spaceId ? { ...space, mode: newMode, updatedAt: Date.now() } : space
          );
          return {
            spaces: updatedSpaces,
          };
        });
      },

      updateTheme: (fontFamily: string) => {
        set((state) => ({
          theme: {
            ...state.theme,
            fontFamily,
          },
        }));
      },
    }),
    {
      name: 'sticky-notes-storage',
    }
  )
);

