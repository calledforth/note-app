import { useCallback, useMemo, useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Note } from '../notes/Note';
import { useNotesStore } from '../../stores/notesStore';
import { getDefaultFreeformPosition } from '../../utils/coordinateConverter';
import { freeformToGrid } from '../../utils/coordinateConverter';

interface FreeformWorkspaceProps {
  spaceId: string;
}

export function FreeformWorkspace({ spaceId }: FreeformWorkspaceProps) {
  const allNotes = useNotesStore((state) => state.notes);
  const freeformPositions = useNotesStore((state) => state.freeformPositions);
  const updateNotePosition = useNotesStore((state) => state.updateNotePosition);
  const addNote = useNotesStore((state) => state.addNote);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });

  // Memoize filtered notes to prevent infinite re-renders
  const notes = useMemo(
    () => allNotes.filter((n) => n.spaceId === spaceId),
    [allNotes, spaceId]
  );

  // Update viewport size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Debounce function for position updates
  const debounce = useCallback(<T extends unknown[]>(func: (...args: T) => void, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: T) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  const debouncedUpdatePosition = useMemo(
    () =>
      debounce((noteId: string, position: { x: number; y: number; width: number; height: number }) => {
        // Access current zIndex from store at call time, not closure time
        const currentPositions = useNotesStore.getState().freeformPositions;
        const freeformPos = {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          zIndex: currentPositions[noteId]?.zIndex || 0,
        };
        updateNotePosition(noteId, 'freeform', freeformPos);
        
        // Also update grid position
        const gridPos = freeformToGrid(freeformPos);
        updateNotePosition(noteId, 'grid', gridPos);
      }, 300),
    [debounce, updateNotePosition]
  );

  const handleDragStop = useCallback(
    (noteId: string) => (_e: unknown, d: { x: number; y: number }) => {
      const currentPos = freeformPositions[noteId];
      if (currentPos) {
        // Update immediately on drag stop (no debounce) to prevent glitchy snap-back
        const freeformPos = {
          x: d.x,
          y: d.y,
          width: currentPos.width,
          height: currentPos.height,
          zIndex: currentPos.zIndex || 0,
        };
        updateNotePosition(noteId, 'freeform', freeformPos);
        
        // Also update grid position immediately
        const gridPos = freeformToGrid(freeformPos);
        updateNotePosition(noteId, 'grid', gridPos);
      }
    },
    [freeformPositions, updateNotePosition]
  );

  const handleResizeStop = useCallback(
    (noteId: string) => (_e: unknown, _direction: unknown, ref: HTMLElement, _delta: unknown, position: { x: number; y: number }) => {
      // Update immediately on resize stop (no debounce) to prevent glitchy snap-back
      const currentPos = freeformPositions[noteId];
      if (currentPos) {
        const freeformPos = {
        x: position.x,
        y: position.y,
        width: ref.offsetWidth,
        height: ref.offsetHeight,
          zIndex: currentPos.zIndex || 0,
        };
        updateNotePosition(noteId, 'freeform', freeformPos);
        
        // Also update grid position immediately
        const gridPos = freeformToGrid(freeformPos);
        updateNotePosition(noteId, 'grid', gridPos);
      }
    },
    [freeformPositions, updateNotePosition]
  );

  const handleAddNote = useCallback(() => {
    const noteId = addNote(spaceId, '');
    const defaultPos = getDefaultFreeformPosition(viewportSize.width, viewportSize.height);
    updateNotePosition(noteId, 'freeform', defaultPos);
    
    // Also create default grid position
    const gridPos = freeformToGrid(defaultPos);
    updateNotePosition(noteId, 'grid', gridPos);
  }, [spaceId, addNote, viewportSize, updateNotePosition]);

  return (
    <div className="w-full h-full flex flex-col bg-background relative">
      <div className="p-3 border-b border-(--border-subtle) bg-(--surface-bg)">
        <button 
          onClick={handleAddNote} 
          className="bg-(--surface-bg) border border-(--border-subtle) text-(--text-primary) px-4 py-2 rounded cursor-pointer font-inherit hover:bg-(--border-subtle)"
        >
          + Add Note
        </button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {notes.map((note) => {
          const position = freeformPositions[note.id];
          if (!position) return null;

          return (
            <Rnd
              key={note.id}
              size={{ width: position.width, height: position.height }}
              position={{ x: position.x, y: position.y }}
              onDragStop={handleDragStop(note.id)}
              onResizeStop={handleResizeStop(note.id)}
              bounds="parent"
              minWidth={280}
              minHeight={300}
              style={{ zIndex: position.zIndex }}
              dragHandleClassName="note-header" // Only header is draggable
              enableResizing={{ bottom: true, bottomRight: true, right: true }}
            >
              <div style={{ width: '100%', height: '100%' }}>
                <Note note={note} mode="freeform" />
              </div>
            </Rnd>
          );
        })}
      </div>
    </div>
  );
}

