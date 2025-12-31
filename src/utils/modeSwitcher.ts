import { useNotesStore } from '../stores/notesStore';
import { convertAllNotes } from './coordinateConverter';
import type { SpaceMode } from '../types';

/**
 * Switch space to grid mode
 * Converts freeform positions to grid positions if needed
 */
export function switchToGridMode(spaceId: string) {
  const store = useNotesStore.getState();
  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) return;

  const spaceNotes = store.notes.filter((n) => n.spaceId === spaceId);
  
  // Check if grid positions already exist for all notes
  const allHaveGridPositions = spaceNotes.every(
    (note) => store.gridPositions[note.id]
  );

  if (!allHaveGridPositions) {
    // Convert freeform positions to grid
    const { freeformPositions, gridPositions } = convertAllNotes(
      spaceNotes,
      'freeform',
      'grid',
      store.freeformPositions,
      store.gridPositions
    );

    // Update store with converted positions
    useNotesStore.setState({
      freeformPositions,
      gridPositions,
    });
  }

  // Switch mode
  store.switchMode(spaceId, 'grid');
}

/**
 * Switch space to freeform mode
 * Converts grid positions to freeform positions if needed
 */
export function switchToFreeformMode(spaceId: string) {
  const store = useNotesStore.getState();
  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) return;

  const spaceNotes = store.notes.filter((n) => n.spaceId === spaceId);
  
  // Check if freeform positions already exist for all notes
  const allHaveFreeformPositions = spaceNotes.every(
    (note) => store.freeformPositions[note.id]
  );

  if (!allHaveFreeformPositions) {
    // Convert grid positions to freeform
    const { freeformPositions, gridPositions } = convertAllNotes(
      spaceNotes,
      'grid',
      'freeform',
      store.freeformPositions,
      store.gridPositions
    );

    // Update store with converted positions
    useNotesStore.setState({
      freeformPositions,
      gridPositions,
    });
  }

  // Switch mode
  store.switchMode(spaceId, 'freeform');
}

/**
 * Switch mode for a space (handles conversion automatically)
 */
export function switchSpaceMode(spaceId: string, newMode: SpaceMode) {
  if (newMode === 'grid') {
    switchToGridMode(spaceId);
  } else {
    switchToFreeformMode(spaceId);
  }
}

