import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useThemeStore, type NoteStyle } from './stores/themeStore';
import { useBentoStore } from './stores/bentoStore';
import { useMantraStore } from './stores/mantraStore';
import { ThemeManager } from './components/theme/ThemeManager';
import { BentoWorkspace } from './components/workspace/BentoWorkspace';
import { TitleBar } from './components/titlebar/TitleBar';
import { CommandPalette, type CommandHandler } from './components/command/CommandPalette';
import { UpdateToast } from './components/updater/UpdateToast';
import { SettingsPanel } from './components/dock/SettingsPanel';
import { MantraPage } from './components/mantra/MantraPage';
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

  // Mantra store
  const shouldShowMantraOnStartup = useMantraStore((state) => state.shouldShowMantraOnStartup);

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Settings Panel state (can be opened from command palette or title bar)
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  // Mantra page state
  const [showMantraStartup, setShowMantraStartup] = useState(false);
  const [showMantraFromPalette, setShowMantraFromPalette] = useState(false);
  const [hasCheckedMantra, setHasCheckedMantra] = useState(false);

  // Initialize the bento store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Check if we should show the mantra on startup (only once)
  useEffect(() => {
    if (isInitialized && !hasCheckedMantra) {
      setHasCheckedMantra(true);
      if (shouldShowMantraOnStartup()) {
        setShowMantraStartup(true);
      }
    }
  }, [isInitialized, hasCheckedMantra, shouldShowMantraOnStartup]);

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

      case 'open-settings':
        setIsSettingsPanelOpen(true);
        break;

      case 'show-mantra':
        setShowMantraFromPalette(true);
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

  // Global keyboard shortcuts - use capture phase to intercept before editors consume events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Ctrl/Cmd + K -> open command palette (highest priority)
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        event.stopPropagation();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Ctrl/Cmd + Shift + P -> open command palette (VS Code style)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'p') {
        event.preventDefault();
        event.stopPropagation();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Ctrl/Cmd + Shift + T -> cycle note style
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 't') {
        event.preventDefault();
        event.stopPropagation();
        cycleNoteStyle();
        return;
      }

      // Ctrl/Cmd + N -> new note
      if ((event.ctrlKey || event.metaKey) && key === 'n') {
        event.preventDefault();
        event.stopPropagation();
        createNote();
        return;
      }
    };

    // Use capture phase to intercept events before they reach the editor
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
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
      <UpdateToast />

      {/* Settings Panel - opened from command palette or title bar */}
      {isSettingsPanelOpen && currentWorkspaceId && (
        <SettingsPanel spaceId={currentWorkspaceId} onClose={() => setIsSettingsPanelOpen(false)} />
      )}

      {/* Mantra Page - Startup (no exit option, must complete) */}
      <AnimatePresence>
        {showMantraStartup && (
          <MantraPage
            canExit={false}
            onComplete={() => setShowMantraStartup(false)}
          />
        )}
      </AnimatePresence>

      {/* Mantra Page - From Command Palette (with exit option) */}
      <AnimatePresence>
        {showMantraFromPalette && (
          <MantraPage
            canExit={true}
            onComplete={() => setShowMantraFromPalette(false)}
            onExit={() => setShowMantraFromPalette(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
