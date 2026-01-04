import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBentoStore } from '../../stores/bentoStore';
import { useThemeStore } from '../../stores/themeStore';
import { SettingsPanel } from '../dock/SettingsPanel';
import {
  ChevronDown,
  Settings2,
  Minimize,
  Maximize,
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

  // Theme store for styling
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle);

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

  // Styling based on current note style
  const isZenVoid = currentNoteStyle === 'zen-void';

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
            className={clsx(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all cursor-pointer",
              isZenVoid
                ? "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                : "bg-[var(--surface-bg)]/50 border border-[var(--border-subtle)] hover:bg-[var(--surface-bg)] hover:border-[var(--text-secondary)]/30"
            )}
          >
            {/* Workspace Mode Icon - Always Bento */}
            <LayoutTemplate className={clsx(
              "w-3 h-3",
              isZenVoid ? "text-white/50" : "text-[var(--text-secondary)]"
            )} />

            {/* Workspace Name */}
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className={clsx(
                  "bg-transparent text-[10px] font-medium focus:outline-none min-w-[60px] w-auto",
                  isZenVoid ? "text-white/80" : "text-[var(--text-primary)]"
                )}
              />
            ) : (
              <span className={clsx(
                "text-[10px] font-medium",
                isZenVoid ? "text-white/80" : "text-[var(--text-primary)]"
              )}>
                {currentWorkspace?.name || 'Select workspace'}
              </span>
            )}

            <ChevronDown className={clsx(
              "w-2.5 h-2.5 transition-transform",
              isZenVoid ? "text-white/40" : "text-[var(--text-secondary)]",
              workspaceMenuOpen && "rotate-180"
            )} />
          </button>

          {/* Animated Dropdown Menu - Theme-aware styling */}
          <AnimatePresence>
            {workspaceMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={clsx(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[220px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] z-50 overflow-hidden",
                  isZenVoid
                    ? "bg-[var(--void-bg)] border border-[var(--void-border)] rounded-md"
                    : "bg-[var(--wabi-bg)] border border-[var(--wabi-border)] rounded-xs"
                )}
              >
                <div className="py-1">
                  {workspaces.map((space, index) => {
                    const isEditingThisSpace = editingDropdownSpaceId === space.id;
                    const isSelected = space.id === currentWorkspaceId;

                    return (
                      <motion.div
                        key={space.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className={clsx(
                          "relative w-full text-left px-2.5 py-1.5 text-xs flex items-center gap-2 group/item cursor-pointer transition-colors",
                          isZenVoid
                            ? "hover:bg-white/5"
                            : "hover:bg-[var(--surface-bg)]",
                          isSelected && (isZenVoid ? "bg-white/5" : "bg-[var(--surface-bg)]")
                        )}
                      >
                        {/* Mode icon with themed background */}
                        <div
                          className={clsx(
                            "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? (isZenVoid ? "bg-white/10" : "bg-[var(--text-secondary)]/20")
                              : (isZenVoid ? "bg-white/5" : "bg-[var(--surface-bg)]")
                          )}
                        >
                          <LayoutTemplate className={clsx(
                            "w-3 h-3",
                            isSelected
                              ? (isZenVoid ? "text-white/80" : "text-[var(--text-primary)]")
                              : (isZenVoid ? "text-white/40" : "text-[var(--text-secondary)]")
                          )} />
                        </div>

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
                            className={clsx(
                              "flex-1 bg-transparent text-xs focus:outline-none border-b",
                              isZenVoid
                                ? "text-white/80 border-white/30"
                                : "text-[var(--text-primary)] border-[var(--text-secondary)]/50"
                            )}
                          />
                        ) : (
                          <span
                            className={clsx(
                              "truncate flex-1 cursor-pointer transition-colors",
                              isSelected
                                ? (isZenVoid ? "text-white/90" : "text-[var(--text-primary)]")
                                : (isZenVoid ? "text-white/50" : "text-[var(--text-secondary)]")
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

                        {/* Edit & Delete - on hover (hide when editing) */}
                        {!isEditingThisSpace && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                            <motion.div
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDropdownName(space.name);
                                setEditingDropdownSpaceId(space.id);
                              }}
                              className={clsx(
                                "p-0.5 cursor-pointer",
                                isZenVoid
                                  ? "text-white/30 hover:text-white/60"
                                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              )}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Pencil className="w-3 h-3" />
                            </motion.div>
                            <motion.div
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Delete workspace?')) {
                                  await deleteWorkspace(space.id);
                                }
                              }}
                              className={clsx(
                                "p-0.5 cursor-pointer",
                                isZenVoid
                                  ? "text-white/30 hover:text-red-400"
                                  : "text-[var(--text-secondary)] hover:text-red-400"
                              )}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </motion.div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Create New */}
                <div className={clsx(
                  "border-t p-1.5",
                  isZenVoid ? "border-[var(--void-border)]" : "border-[var(--wabi-border)]"
                )}>
                  {!showCreateSpace ? (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: workspaces.length * 0.03 + 0.1 }}
                      onClick={() => setShowCreateSpace(true)}
                      className={clsx(
                        "w-full flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-xs",
                        isZenVoid
                          ? "text-white/40 hover:text-white/70 hover:bg-white/5"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)]"
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Workspace</span>
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-2 p-1"
                    >
                      <input
                        autoFocus
                        placeholder="Workspace name..."
                        className={clsx(
                          "w-full rounded px-2 py-1 text-xs focus:outline-none",
                          isZenVoid
                            ? "bg-white/5 border border-white/10 text-white/80 placeholder:text-white/30"
                            : "bg-[var(--app-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                        )}
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateSpace();
                          if (e.key === 'Escape') setShowCreateSpace(false);
                        }}
                      />

                      <motion.button
                        onClick={handleCreateSpace}
                        className={clsx(
                          "w-full text-[10px] font-semibold py-1 rounded transition-opacity hover:opacity-90",
                          isZenVoid
                            ? "bg-white/10 text-white/80"
                            : "bg-[var(--text-primary)] text-[var(--app-bg)]"
                        )}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Create
                      </motion.button>
                    </motion.div>
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
              className={clsx(
                "w-7 h-6 flex items-center justify-center transition-colors",
                isZenVoid
                  ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)]"
              )}
              title="Settings"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMinimize}
              className={clsx(
                "w-7 h-6 flex items-center justify-center transition-colors",
                isZenVoid
                  ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)]"
              )}
              title="Minimize"
            >
              <Minimize className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className={clsx(
                "w-7 h-6 flex items-center justify-center transition-colors",
                isZenVoid
                  ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)]"
              )}
              title="Maximize"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className={clsx(
                "w-7 h-6 flex items-center justify-center transition-colors",
                isZenVoid
                  ? "text-white/30 hover:bg-red-500/80 hover:text-white"
                  : "text-[var(--text-secondary)] hover:bg-red-500 hover:text-white"
              )}
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
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
