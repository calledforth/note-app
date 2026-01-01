import { useEffect, useState, useCallback } from 'react';
import { useThemeStore, type NoteStyle } from './stores/themeStore';
import { useBentoStore } from './stores/bentoStore';
import { ThemeManager } from './components/theme/ThemeManager';
import { BentoWorkspace } from './components/workspace/BentoWorkspace';
import { TitleBar } from './components/titlebar/TitleBar';
import { CommandPalette, type CommandHandler } from './components/command/CommandPalette';
import './types/electron.d';


function App() {
  // Bento store state
  const workspaces = useBentoStore((state) => state.workspaces);
  const currentWorkspaceId = useBentoStore((state) => state.currentWorkspaceId);
  const isLoading = useBentoStore((state) => state.isLoading);
  const isInitialized = useBentoStore((state) => state.isInitialized);
  const initialize = useBentoStore((state) => state.initialize);
  const createWorkspace = useBentoStore((state) => state.createWorkspace);
  const switchWorkspace = useBentoStore((state) => state.switchWorkspace);
  const createNote = useBentoStore((state) => state.createNote);

  // Theme actions
  const cycleNoteStyle = useThemeStore((state) => state.cycleNoteStyle);
  const setNoteStyle = useThemeStore((state) => state.setNoteStyle);

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Initialize the bento store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Command execution handler
  const handleExecuteCommand: CommandHandler = useCallback(async (commandId: string, payload?: unknown) => {
    // Handle workspace switching (dynamic commands)
    if (commandId.startsWith('workspace-')) {
      const workspaceId = commandId.replace('workspace-', '');
      await switchWorkspace(workspaceId);
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
        await createNote();
        break;

      case 'create-workspace':
        if (payload && typeof payload === 'object' && 'name' in payload) {
          const { name } = payload as { name: string };
          await createWorkspace(name);
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
  }, [switchWorkspace, setNoteStyle, createNote, createWorkspace, cycleNoteStyle]);

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

      // Ctrl/Cmd + Shift + T -> cycle note style
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 't') {
        event.preventDefault();
        cycleNoteStyle();
        return;
      }

      // Ctrl/Cmd + N -> new note
      if ((event.ctrlKey || event.metaKey) && key === 'n') {
        event.preventDefault();
        createNote();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleNoteStyle, createNote]);

  const currentWorkspace = workspaces.find((s) => s.id === currentWorkspaceId);

  // Show loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[var(--app-bg)] text-[var(--text-secondary)]">
        <ThemeManager />
        <p>Loading...</p>
      </div>
    );
  }

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
          {currentWorkspace ? (
            <BentoWorkspace spaceId={currentWorkspace.id} />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
              <p>No workspace selected</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
