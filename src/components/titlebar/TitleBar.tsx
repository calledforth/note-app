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
        className="h-8 bg-[var(--app-bg)] flex items-center justify-between select-none pl-2 pr-0 relative"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left spacer */}
        <div className="flex-1" />

        {/* Center: Clickable space title -> opens Spaces picker command palette */}
        <div
          className="relative flex items-center gap-2 z-10"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => onOpenSpacesPicker?.()}
            className="flex items-center transition-all cursor-pointer hover:opacity-70"
            title="Switch space"
          >
            <span
              className="text-xs font-medium text-[#bbb]"
              style={{ fontFamily: currentFontFamily }}
            >
              {currentWorkspace?.name || 'Spaces'}
            </span>
          </button>
        </div>

        {/* Right: Controls */}
        <div
          className="flex-1 flex items-center justify-end relative z-10 pr-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className="flex items-center">
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-8 flex items-center justify-center transition-colors text-[#888] hover:text-[#ccc] hover:bg-white/5"
              title="Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleMinimize}
              className="w-10 h-8 flex items-center justify-center transition-colors text-[#888] hover:text-[#ccc] hover:bg-white/5"
              title="Minimize"
            >
              <Minus className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleMaximize}
              className="w-10 h-8 flex items-center justify-center transition-colors text-[#888] hover:text-[#ccc] hover:bg-white/5"
              title="Maximize"
            >
              <Square className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleClose}
              className="w-10 h-8 flex items-center justify-center transition-colors text-[#888] hover:bg-red-500 hover:text-white"
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
