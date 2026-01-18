import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBentoStore } from '../../stores/bentoStore';
import { useThemeStore, EDITOR_FONTS } from '../../stores/themeStore';
import { SettingsPanel } from '../dock/SettingsPanel';
import {
  ChevronDown,
  Settings2,
  Minus,
  Square,
  X,
  Plus,
  LayoutTemplate,
  Pencil,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import '../../types/electron.d';


export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  // Bento store
  const workspaces = useBentoStore((state) => state.workspaces);
  const currentWorkspaceId = useBentoStore((state) => state.currentWorkspaceId);
  const switchWorkspace = useBentoStore((state) => state.switchWorkspace);
  const createWorkspace = useBentoStore((state) => state.createWorkspace);
  const deleteWorkspace = useBentoStore((state) => state.deleteWorkspace);
  const updateWorkspaceName = useBentoStore((state) => state.updateWorkspaceName);

  // Theme store for fonts
  const currentEditorFont = useThemeStore((state) => state.currentEditorFont);

  // Get the font family string for the current editor font
  const currentFontFamily = useMemo(() => {
    const font = EDITOR_FONTS.find(f => f.key === currentEditorFont);
    return font?.fontFamily || "'Geist', system-ui, sans-serif";
  }, [currentEditorFont]);

  const [showSettings, setShowSettings] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  // Inline dropdown editing
  const [editingDropdownSpaceId, setEditingDropdownSpaceId] = useState<string | null>(null);
  const [editingDropdownName, setEditingDropdownName] = useState('');

  const menuRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownInputRef = useRef<HTMLInputElement | null>(null);

  const currentWorkspace = useMemo(
    () => workspaces.find((s) => s.id === currentWorkspaceId) || null,
    [workspaces, currentWorkspaceId]
  );

  useEffect(() => {
    if (currentWorkspace) {
      setEditingName(currentWorkspace.name);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (editingDropdownSpaceId && dropdownInputRef.current) {
      dropdownInputRef.current.focus();
      dropdownInputRef.current.select();
    }
  }, [editingDropdownSpaceId]);

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

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!workspaceMenuOpen) return;
      const target = e.target as Node | null;
      if (target && menuRef.current && !menuRef.current.contains(target)) {
        setWorkspaceMenuOpen(false);
        setShowCreateSpace(false);
        setEditingDropdownSpaceId(null);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [workspaceMenuOpen]);

  const handleMinimize = () => window.electronAPI?.windowControls.minimize();
  const handleMaximize = () => {
    window.electronAPI?.windowControls.maximize();
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => window.electronAPI?.windowControls.close();

  const handleCreateSpace = async () => {
    const name = newSpaceName.trim() || 'Untitled Workspace';
    await createWorkspace(name);
    setNewSpaceName('');
    setShowCreateSpace(false);
    setWorkspaceMenuOpen(false);
  };

  const handleNameSave = async () => {
    if (currentWorkspace && editingName.trim()) {
      await updateWorkspaceName(currentWorkspace.id, editingName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') {
      setEditingName(currentWorkspace?.name || '');
      setIsEditingName(false);
    }
  };


  return (
    <>
      {/* Title Bar - h-7, always visible */}
      <div
        className="h-8 bg-[var(--app-bg)] flex items-center justify-between select-none pl-2 pr-0 relative"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left spacer */}
        <div className="flex-1" />

        {/* Centered Workspace Selector */}
        <div
          className="relative flex items-center gap-2 z-10"
          ref={menuRef}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-70"
          >
            {/* Workspace Name */}
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-xs font-medium focus:outline-none min-w-[60px] w-auto text-[#bbb]"
                style={{ fontFamily: currentFontFamily }}
              />
            ) : (
              <span
                className="text-xs font-medium text-[#bbb]"
                style={{ fontFamily: currentFontFamily }}
              >
                {currentWorkspace?.name || 'Select workspace'}
              </span>
            )}

            <ChevronDown className={clsx(
              "w-3 h-3 transition-transform text-[#888]",
              workspaceMenuOpen && "rotate-180"
            )} />
          </button>

          {/* Minimalist Dropdown Menu - Wabi Grid theme */}
          <AnimatePresence>
            {workspaceMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[200px] z-[200] overflow-hidden cursor-default bg-[var(--wabi-bg)] border border-[var(--wabi-border)] rounded-md shadow-2xl"
                style={{ cursor: 'default', fontFamily: currentFontFamily }}
              >
                {/* Workspace list */}
                <div className="py-1 max-h-[200px] overflow-y-auto">
                  {workspaces.map((space) => {
                    const isEditingThisSpace = editingDropdownSpaceId === space.id;
                    const isSelected = space.id === currentWorkspaceId;

                    return (
                      <div
                        key={space.id}
                        className={clsx(
                          "relative w-full text-left px-3 py-2 text-xs flex items-center gap-2 group/item cursor-default transition-colors",
                          "hover:bg-white/5",
                          isSelected && "bg-white/5"
                        )}
                      >
                        {/* Simple icon */}
                        <LayoutTemplate className={clsx(
                          "w-4 h-4 flex-shrink-0",
                          isSelected ? "text-[var(--wabi-text)]" : "text-[var(--wabi-text-muted)]"
                        )} />

                        {/* Workspace name - show input if editing */}
                        {isEditingThisSpace ? (
                          <input
                            ref={dropdownInputRef}
                            value={editingDropdownName}
                            onChange={(e) => setEditingDropdownName(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                if (editingDropdownName.trim()) {
                                  await updateWorkspaceName(space.id, editingDropdownName.trim());
                                }
                                setEditingDropdownSpaceId(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingDropdownSpaceId(null);
                              }
                            }}
                            onBlur={async () => {
                              if (editingDropdownName.trim()) {
                                await updateWorkspaceName(space.id, editingDropdownName.trim());
                              }
                              setEditingDropdownSpaceId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-transparent text-xs text-[var(--wabi-text)] focus:outline-none border-b border-[var(--wabi-border)]"
                            style={{ fontFamily: currentFontFamily }}
                          />
                        ) : (
                          <span
                            className={clsx(
                              "truncate flex-1 cursor-pointer",
                              isSelected ? "text-[var(--wabi-text)]" : "text-[var(--wabi-text-muted)]"
                            )}
                            onClick={async () => {
                              await switchWorkspace(space.id);
                              setWorkspaceMenuOpen(false);
                            }}
                            title={space.name}
                          >
                            {space.name}
                          </span>
                        )}

                        {/* Edit & Delete - minimal, on hover */}
                        {!isEditingThisSpace && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDropdownName(space.name);
                                setEditingDropdownSpaceId(space.id);
                              }}
                              className="p-0.5 text-[var(--wabi-text-muted)] hover:text-[var(--wabi-text)] transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Delete workspace?')) {
                                  await deleteWorkspace(space.id);
                                }
                              }}
                              className="p-0.5 text-[var(--wabi-text-muted)] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Create New - simplified */}
                <div className="border-t border-[var(--wabi-border)] p-1">
                  {!showCreateSpace ? (
                    <button
                      onClick={() => setShowCreateSpace(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--wabi-text-muted)] hover:text-[var(--wabi-text)] hover:bg-white/5 rounded transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Workspace</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1.5 p-1.5">
                      <input
                        autoFocus
                        placeholder="Workspace name..."
                        className="w-full bg-transparent border border-[var(--wabi-border)] rounded px-2 py-1.5 text-xs text-[var(--wabi-text)] placeholder:text-[var(--wabi-text-muted)] focus:outline-none focus:border-[var(--wabi-text-muted)]"
                        style={{ fontFamily: currentFontFamily }}
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateSpace();
                          if (e.key === 'Escape') setShowCreateSpace(false);
                        }}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShowCreateSpace(false)}
                          className="flex-1 text-[10px] text-[var(--wabi-text-muted)] py-1 rounded hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateSpace}
                          className="flex-1 text-[10px] text-[var(--wabi-text)] py-1 rounded bg-white/10 hover:bg-white/15 transition-colors"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Controls */}
        <div className="flex-1 flex items-center justify-end relative z-10 pr-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
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
