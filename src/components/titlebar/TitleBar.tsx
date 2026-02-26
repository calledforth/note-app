import React, { useEffect, useMemo, useState } from 'react';
import { useBentoStore } from '../../stores/bentoStore';
import { useThemeStore, EDITOR_FONTS } from '../../stores/themeStore';
import { SettingsPanel } from '../dock/SettingsPanel';
import { Settings2, Minus, Square, X } from 'lucide-react';
import '../../types/electron.d';

interface TitleBarProps {
  onOpenSpacesPicker?: () => void;
}

export function TitleBar({ onOpenSpacesPicker }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  // Bento store
  const workspaces = useBentoStore((state) => state.workspaces);
  const currentWorkspaceId = useBentoStore((state) => state.currentWorkspaceId);

  // Theme store for fonts
  const currentEditorFont = useThemeStore((state) => state.currentEditorFont);

  const currentFontFamily = useMemo(() => {
    const font = EDITOR_FONTS.find((f) => f.key === currentEditorFont);
    return font?.fontFamily || "'Geist', system-ui, sans-serif";
  }, [currentEditorFont]);

  const currentWorkspace = useMemo(
    () => workspaces.find((s) => s.id === currentWorkspaceId) || null,
    [workspaces, currentWorkspaceId]
  );

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI?.windowControls) {
        const maximized = await window.electronAPI.windowControls.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
    const interval = setInterval(checkMaximized, 500);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => window.electronAPI?.windowControls.minimize();
  const handleMaximize = () => {
    window.electronAPI?.windowControls.maximize();
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => window.electronAPI?.windowControls.close();

  return (
    <>
      {/* Title Bar - always visible */}
      <div
        className="h-8 bg-(--app-bg) flex items-center select-none pl-2 pr-0 relative"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left: draggable area */}
        <div className="flex-1 min-w-0" />

        {/* Center: Workspace name - absolutely positioned for true visual centering */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-10"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => onOpenSpacesPicker?.()}
            className="flex items-center transition-all cursor-pointer hover:opacity-70"
            title="Switch space"
          >
            <span
              className="text-[13px] font-medium text-(--text-primary)"
              style={{ fontFamily: currentFontFamily }}
            >
              {currentWorkspace?.name || 'Spaces'}
            </span>
          </button>
        </div>

        {/* Right: draggable spacer + window controls */}
        <div className="flex-1 min-w-0 flex items-center justify-end">
          <div
            className="flex items-center"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-8 flex items-center justify-center transition-colors text-(--text-primary) hover:text-(--note-control) hover:bg-(--note-control-bg-hover)"
              title="Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleMinimize}
              className="w-10 h-8 flex items-center justify-center transition-colors text-(--text-primary) hover:text-(--note-control) hover:bg-(--note-control-bg-hover)"
              title="Minimize"
            >
              <Minus className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleMaximize}
              className="w-10 h-8 flex items-center justify-center transition-colors text-(--text-primary) hover:text-(--note-control) hover:bg-(--note-control-bg-hover)"
              title="Maximize"
            >
              <Square className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleClose}
              className="w-10 h-8 flex items-center justify-center transition-colors text-(--text-primary) hover:bg-(--note-danger-strong) hover:text-(--note-danger-text)"
              title="Close"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {showSettings && currentWorkspaceId && (
        <SettingsPanel spaceId={currentWorkspaceId} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
