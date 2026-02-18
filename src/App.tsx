import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useThemeStore, type NoteStyle, type EditorFont } from './stores/themeStore';
import { useBentoStore } from './stores/bentoStore';
import { useMantraStore } from './stores/mantraStore';
import { ThemeManager } from './components/theme/ThemeManager';
import { BentoWorkspace } from './components/workspace/BentoWorkspace';
import { TitleBar } from './components/titlebar/TitleBar';
import { CommandPalette, type CommandHandler, type CommandPaletteVariant } from './components/command/CommandPalette';
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
  const deleteWorkspace = useBentoStore((state) => state.deleteWorkspace);
  const updateWorkspaceName = useBentoStore((state) => state.updateWorkspaceName);

  // Theme actions
  const cycleNoteStyle = useThemeStore((state) => state.cycleNoteStyle);
  const setNoteStyle = useThemeStore((state) => state.setNoteStyle);
  const cycleEditorFont = useThemeStore((state) => state.cycleEditorFont);
  const setEditorFont = useThemeStore((state) => state.setEditorFont);

  // Mantra store
  const shouldShowMantraOnStartup = useMantraStore((state) => state.shouldShowMantraOnStartup);
  const mantraAutoOpenEnabled = useMantraStore((state) => state.mantraAutoOpenEnabled);

  // Database readiness state
  const [isDbReady, setIsDbReady] = useState(false);

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteVariant, setCommandPaletteVariant] = useState<CommandPaletteVariant>('all');

  // Settings Panel state (can be opened from command palette or title bar)
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  // Mantra page state
  const [showMantraStartup, setShowMantraStartup] = useState(false);
  const [showMantraFromPalette, setShowMantraFromPalette] = useState(false);
  const [hasCheckedMantra, setHasCheckedMantra] = useState(false);

  // Wait for database readiness before initializing
  useEffect(() => {
    let isCancelled = false;
    let removeListener: (() => void) | undefined;

    const setupDatabaseReady = async () => {
      const dbStatus = window.electronAPI?.databaseStatus;
      if (!dbStatus) {
        setIsDbReady(true);
        return;
      }

      const ready = await dbStatus.isReady();
      if (isCancelled) return;

      if (ready) {
        setIsDbReady(true);
        return;
      }

      removeListener = dbStatus.onReady(() => {
        if (!isCancelled) setIsDbReady(true);
      });
    };

    setupDatabaseReady();

    return () => {
      isCancelled = true;
      if (removeListener) removeListener();
    };
  }, []);

  // Initialize the bento store on mount
  useEffect(() => {
    if (!isInitialized && isDbReady) {
      initialize();
    }
  }, [initialize, isInitialized, isDbReady]);

  // Check if we should show the mantra on startup (only once)
  useEffect(() => {
    if (isInitialized && !hasCheckedMantra) {
      setHasCheckedMantra(true);
      if (mantraAutoOpenEnabled && shouldShowMantraOnStartup()) {
        setShowMantraStartup(true);
      }
    }
  }, [isInitialized, hasCheckedMantra, mantraAutoOpenEnabled, shouldShowMantraOnStartup]);

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

    // Handle font setting (dynamic commands)
    if (commandId.startsWith('font-')) {
      const fontKey = commandId.replace('font-', '') as EditorFont;
      setEditorFont(fontKey);
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

      case 'rename-workspace':
        if (payload && typeof payload === 'object' && 'id' in payload && 'name' in payload) {
          const { id, name } = payload as { id: string; name: string };
          await updateWorkspaceName(id, name);
        }
        break;

      case 'delete-workspace':
        if (payload && typeof payload === 'object' && 'id' in payload) {
          const { id } = payload as { id: string };
          await deleteWorkspace(id);
        }
        break;

      case 'toggle-style':
        cycleNoteStyle();
        break;

      case 'toggle-font':
        cycleEditorFont();
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
  }, [switchWorkspace, setNoteStyle, setEditorFont, createNote, createWorkspace, updateWorkspaceName, deleteWorkspace, cycleNoteStyle, cycleEditorFont]);

  // Global keyboard shortcuts - use capture phase to intercept before editors consume events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Ctrl/Cmd + K -> open command palette (highest priority)
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        event.stopPropagation();
        setCommandPaletteVariant('all');
        setIsCommandPaletteOpen(true);
        return;
      }

      // Ctrl/Cmd + Shift + P -> open command palette (VS Code style)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'p') {
        event.preventDefault();
        event.stopPropagation();
        setCommandPaletteVariant('all');
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

      // Ctrl/Cmd + Shift + F -> cycle editor font
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'f') {
        event.preventDefault();
        event.stopPropagation();
        cycleEditorFont();
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
  }, [cycleNoteStyle, cycleEditorFont, createNote]);

  const currentWorkspace = workspaces.find((s) => s.id === currentWorkspaceId);

  // Show loading state
  if (isLoading || !isInitialized || !isDbReady) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-(--app-bg) text-(--text-secondary)">
        <ThemeManager />
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-(--text-secondary) border-t-(--text-primary) animate-spin" />
          <div className="text-xs tracking-wide text-(--text-secondary)">Loading workspace...</div>
        </div>
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
        variant={commandPaletteVariant}
      />
      <div className="w-screen h-screen flex flex-col bg-(--app-bg) text-(--text-primary) overflow-hidden">
        <TitleBar
          onOpenSpacesPicker={() => {
            setCommandPaletteVariant('spaces');
            setIsCommandPaletteOpen(true);
          }}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentWorkspace ? (
            <BentoWorkspace spaceId={currentWorkspace.id} />
          ) : (
            <div className="flex items-center justify-center h-full text-(--text-secondary)">
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
