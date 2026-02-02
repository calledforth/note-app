import { useCallback, useMemo, useState, useEffect } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Note } from '../notes/Note';
import { useNotesStore } from '../../stores/notesStore';
import { getDefaultGridPosition, gridToFreeform } from '../../utils/coordinateConverter';

interface GridWorkspaceProps {
  spaceId: string;
}

export function GridWorkspace({ spaceId }: GridWorkspaceProps) {
  const allNotes = useNotesStore((state) => state.notes);
  const gridPositions = useNotesStore((state) => state.gridPositions);
  const updateNotePosition = useNotesStore((state) => state.updateNotePosition);
  const addNote = useNotesStore((state) => state.addNote);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Memoize filtered notes to prevent infinite re-renders
  const notes = useMemo(
    () => allNotes.filter((n) => n.spaceId === spaceId),
    [allNotes, spaceId]
  );

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(window.innerWidth - 100); // Account for padding/margins
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Convert notes to react-grid-layout format
  const layout = useMemo<Layout[]>(() => {
    return notes
      .filter((note) => gridPositions[note.id])
      .map((note) => {
        const pos = gridPositions[note.id];
        return {
          i: note.id,
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
        };
      });
  }, [notes, gridPositions]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      newLayout.forEach((item) => {
        const gridPos = {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        };
        updateNotePosition(item.i, 'grid', gridPos);
        
        // Also update freeform position
        const freeformPos = gridToFreeform(gridPos);
        updateNotePosition(item.i, 'freeform', freeformPos);
      });
    },
    [updateNotePosition]
  );

  const handleAddNote = useCallback(() => {
    const noteId = addNote(spaceId, '');
    const defaultGridPos = getDefaultGridPosition(layout);
    updateNotePosition(noteId, 'grid', defaultGridPos);
    
    // Also create default freeform position
    const freeformPos = gridToFreeform(defaultGridPos);
    updateNotePosition(noteId, 'freeform', freeformPos);
  }, [spaceId, addNote, layout, updateNotePosition]);

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="p-3 border-b border-(--border-subtle) bg-(--surface-bg)">
        <button 
          onClick={handleAddNote} 
          className="bg-(--surface-bg) border border-(--border-subtle) text-(--text-primary) px-4 py-2 rounded cursor-pointer font-inherit hover:bg-(--border-subtle)"
        >
          + Add Note
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2.5 [&_.react-grid-layout]:relative [&_.react-grid-item]:transition-all [&_.react-grid-item]:duration-200 [&_.react-grid-item]:ease-in-out [&_.react-grid-item>div]:w-full [&_.react-grid-item>div]:h-full">
        <GridLayout
          className="layout"
          layout={layout}
          cols={15}
          rowHeight={50}
          width={containerWidth}
          margin={[5, 5]}
          containerPadding={[10, 10]}
          allowOverlap={false}
          preventCollision={false}
          compactType="vertical"
          isDraggable={true}
          isResizable={true}
          draggableHandle=".note-header"
          draggableCancel=".ql-editor, .ql-container, input, textarea, button"
          onLayoutChange={handleLayoutChange}
        >
          {notes
            .filter((note) => gridPositions[note.id])
            .map((note) => (
              <div key={note.id}>
                <Note note={note} mode="grid" />
              </div>
            ))}
        </GridLayout>
      </div>
    </div>
  );
}

