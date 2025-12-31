import { useEffect, useState, useCallback } from 'react';
import { useNotesStore } from './stores/notesStore';
import { useUiStore } from './stores/uiStore';
import { useThemeStore, type NoteStyle } from './stores/themeStore';
import { ThemeManager } from './components/theme/ThemeManager';
import { FreeformWorkspace } from './components/workspace/FreeformWorkspace';
import { GridWorkspace } from './components/workspace/GridWorkspace';
import { BentoWorkspace } from './components/workspace/BentoWorkspace';
import { TitleBar } from './components/titlebar/TitleBar';
import { CommandPalette, type CommandHandler } from './components/command/CommandPalette';

// Declare electron API type
declare global {
  interface Window {
    electronAPI?: {
      windowControls: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };
    };
  }
}

function App() {
  const currentSpaceId = useNotesStore((state) => state.currentSpaceId);
  const spaces = useNotesStore((state) => state.spaces);
  const addSpace = useNotesStore((state) => state.addSpace);
  const switchSpace = useNotesStore((state) => state.switchSpace);
  const enterDashboard = useUiStore((state) => state.enterDashboard);
  const enterFocus = useUiStore((state) => state.enterFocus);
  const cycleNoteStyle = useThemeStore((state) => state.cycleNoteStyle);
  const setNoteStyle = useThemeStore((state) => state.setNoteStyle);

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Initialize with default space if none exists
  useEffect(() => {
    if (spaces.length === 0) {
      useNotesStore.getState().addSpace('My Workspace', 'bento');
    } else if (!currentSpaceId) {
      switchSpace(spaces[0].id);
    }
  }, [spaces, currentSpaceId, switchSpace]);

  // Command execution handler
  const handleExecuteCommand: CommandHandler = useCallback((commandId: string, payload?: unknown) => {
    // Handle workspace switching (dynamic commands)
    if (commandId.startsWith('workspace-')) {
      const workspaceId = commandId.replace('workspace-', '');
      switchSpace(workspaceId);
      return;
    }

    // Handle style setting (dynamic commands)
    if (commandId.startsWith('style-')) {
      const styleKey = commandId.replace('style-', '') as NoteStyle;
      setNoteStyle(styleKey);
      return;
    }

    // Handle static commands
    switch (commandId) {
      case 'new-note':
        // Create a new note in the current workspace
        if (currentSpaceId) {
          useNotesStore.getState().addNote(currentSpaceId, '');
          // Switch to dashboard mode to see the new note
          enterDashboard();
        }
        break;

      case 'create-workspace':
        // Create new workspace with provided name (defaults to Bento with 4x4 grid)
        if (payload && typeof payload === 'object' && 'name' in payload) {
          const { name } = payload as { name: string };
          addSpace(name, 'bento');
        }
        break;

      case 'toggle-style':
        cycleNoteStyle();
        break;

      case 'window-minimize':
        window.electronAPI?.windowControls.minimize();
        break;

      case 'window-maximize':
        window.electronAPI?.windowControls.maximize();
        break;

      case 'window-close':
        window.electronAPI?.windowControls.close();
        break;

      default:
        console.log('Unknown command:', commandId);
    }
  }, [currentSpaceId, switchSpace, setNoteStyle, addSpace, cycleNoteStyle, enterDashboard]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Ctrl/Cmd + K -> open command palette
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Ctrl/Cmd + Shift + P -> open command palette (VS Code style)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'p') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Ctrl/Cmd + Shift + T -> cycle note style (Wabi Grid <-> Zen Void)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 't') {
        event.preventDefault();
        cycleNoteStyle();
        return;
      }

      // Ctrl/Cmd + N -> new note
      if ((event.ctrlKey || event.metaKey) && key === 'n') {
        event.preventDefault();
        if (currentSpaceId) {
          useNotesStore.getState().addNote(currentSpaceId, '');
          enterDashboard();
        }
        return;
      }

      // Ctrl/Cmd + E -> enter dashboard/editing mode
      if ((event.ctrlKey || event.metaKey) && key === 'e') {
        event.preventDefault();
        enterDashboard();
        return;
      }

      // Escape -> return to focus mode (only if command palette is not open)
      if (key === 'escape' && !isCommandPaletteOpen) {
        enterFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enterDashboard, enterFocus, cycleNoteStyle, isCommandPaletteOpen, currentSpaceId]);

  const currentSpace = spaces.find((s) => s.id === currentSpaceId);

  return (
    <>
      <ThemeManager />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onExecuteCommand={handleExecuteCommand}
      />
      <div className="w-screen h-screen flex flex-col bg-[var(--app-bg)] text-[var(--text-primary)] overflow-hidden">
        <TitleBar />
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentSpace ? (
            currentSpace.mode === 'freeform' ? (
              <FreeformWorkspace spaceId={currentSpace.id} />
            ) : currentSpace.mode === 'bento' ? (
              <BentoWorkspace spaceId={currentSpace.id} />
            ) : (
              <GridWorkspace spaceId={currentSpace.id} />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
              <p>No space selected</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
