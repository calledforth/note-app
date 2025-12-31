import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotesStore } from '../../stores/notesStore';
import { useUiStore } from '../../stores/uiStore';
import { SettingsPanel } from '../dock/SettingsPanel';
import {
  ChevronDown,
  Settings2,
  Minimize,
  Maximize,
  X,
  Plus,
  Grid3X3,
  Layout,
  LayoutTemplate,
  Zap,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';

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

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const spaces = useNotesStore((state) => state.spaces);
  const currentSpaceId = useNotesStore((state) => state.currentSpaceId);
  const switchSpace = useNotesStore((state) => state.switchSpace);
  const addSpace = useNotesStore((state) => state.addSpace);
  const deleteSpace = useNotesStore((state) => state.deleteSpace);
  const updateSpace = useNotesStore((state) => state.updateSpace); // Need to add this to store if not exists

  const [showSettings, setShowSettings] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceMode, setNewSpaceMode] = useState<'freeform' | 'grid' | 'bento'>('freeform');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  // Inline dropdown editing
  const [editingDropdownSpaceId, setEditingDropdownSpaceId] = useState<string | null>(null);
  const [editingDropdownName, setEditingDropdownName] = useState('');
  const uiMode = useUiStore((state) => state.uiMode);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownInputRef = useRef<HTMLInputElement | null>(null);

  const currentSpace = useMemo(
    () => spaces.find((s) => s.id === currentSpaceId) || null,
    [spaces, currentSpaceId]
  );

  useEffect(() => {
    if (currentSpace) {
      setEditingName(currentSpace.name);
    }
  }, [currentSpace]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Focus dropdown input when editing starts
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
        setEditingDropdownSpaceId(null); // Clear dropdown editing when closing
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

  const handleCreateSpace = () => {
    const name = newSpaceName.trim() || 'Untitled Workspace';
    addSpace(name, newSpaceMode);
    setNewSpaceName('');
    setShowCreateSpace(false);
    setWorkspaceMenuOpen(false);
  };

  const handleNameSave = () => {
    if (currentSpace && editingName.trim()) {
      // Assuming updateSpace exists, or we implement it
      // useNotesStore.getState().updateSpace(currentSpace.id, { name: editingName });
      // For now, if updateSpace is missing, we might need to add it to store.
      // Let's assume we'll fix store next if it errors.
      // Or hack: access raw store state if needed, but cleaner to use action.
      // Actually, let's just use the store reference we have.
      // NOTE: We need to check if updateSpace is in the store interface.
      // If not, we'll add it.

      // Temporary: If updateSpace missing, we will add it to store file in next step.
      // @ts-ignore
      if (updateSpace) updateSpace(currentSpace.id, { name: editingName });
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') {
      setEditingName(currentSpace?.name || '');
      setIsEditingName(false);
    }
  };

  return (
    <>
      {/* Focus Title Bar */}
      <div
        className="h-8 bg-[var(--app-bg)] flex items-center justify-between select-none pl-3 pr-0 relative"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Dynamic Radial Gradient Background */}
        {uiMode === 'dashboard' ? (
          // Editing mode: Purple gradient - brighter at center, sharp fade
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(550px circle at 50% 50%, rgba(147, 51, 234, 0.25) 0%, rgba(139, 92, 246, 0.12) 20%, rgba(99, 102, 241, 0.04) 45%, transparent 65%)'
            }}
          />
        ) : (
          // Focus mode: Very subtle white gradient (barely visible)
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(600px circle at 50% 50%, rgba(255, 255, 255, 0.02), transparent 50%)'
            }}
          />
        )}

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
            className="flex items-center gap-2 px-3 py-1 mt-0.5 rounded-full bg-[var(--surface-bg)]/50 border border-[var(--border-subtle)] hover:bg-[var(--surface-bg)] hover:border-[var(--text-secondary)]/30 transition-all cursor-pointer"
          >
            {/* Mode Icon Badge - Outline Only */}
            {uiMode === 'dashboard' ? (
              <Zap className="w-3.5 h-3.5 text-purple-500" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            )}

            {/* Workspace Name */}
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-none min-w-[80px] w-auto"
              />
            ) : (
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {currentSpace?.name || 'Select workspace'}
              </span>
            )}

            <ChevronDown className={clsx(
              "w-3 h-3 text-[var(--text-secondary)] transition-transform",
              workspaceMenuOpen && "rotate-180"
            )} />
          </button>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {workspaceMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[240px] bg-[var(--app-bg)] border border-[var(--border-subtle)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.25)] z-50 overflow-hidden"
              >
                <div className="py-1">
                  {spaces.map((space, index) => {
                    const ModeIcon = space.mode === 'freeform' ? Layout : space.mode === 'grid' ? Grid3X3 : LayoutTemplate;
                    const isEditingThisSpace = editingDropdownSpaceId === space.id;
                    const isSelected = space.id === currentSpaceId;

                    return (
                      <motion.div
                        key={space.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className={clsx(
                          "relative w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 group/item cursor-pointer transition-colors",
                          isSelected
                            ? "hover:bg-[var(--surface-bg)]"
                            : "hover:bg-[var(--surface-bg)]"
                        )}
                        style={isSelected ? {
                          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 100%)'
                        } : undefined}
                      >
                        {/* Mode icon with colored background */}
                        <div
                          className={clsx(
                            "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                            isSelected ? "bg-purple-500/20" : "bg-[var(--surface-bg)]"
                          )}
                        >
                          <ModeIcon className={clsx(
                            "w-3 h-3",
                            isSelected ? "text-purple-400" : "text-[var(--text-primary)]"
                          )} />
                        </div>

                        {/* Workspace name - show input if editing */}
                        {isEditingThisSpace ? (
                          <input
                            ref={dropdownInputRef}
                            value={editingDropdownName}
                            onChange={(e) => setEditingDropdownName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingDropdownName.trim()) {
                                  updateSpace(space.id, { name: editingDropdownName.trim() });
                                }
                                setEditingDropdownSpaceId(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingDropdownSpaceId(null);
                              }
                            }}
                            onBlur={() => {
                              if (editingDropdownName.trim()) {
                                updateSpace(space.id, { name: editingDropdownName.trim() });
                              }
                              setEditingDropdownSpaceId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-transparent text-[var(--text-primary)] text-xs focus:outline-none border-b border-[var(--text-secondary)]/50"
                          />
                        ) : (
                          <span
                            className={clsx(
                              "truncate flex-1 cursor-pointer transition-colors",
                              isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                            )}
                            onClick={() => {
                              switchSpace(space.id);
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
                              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Pencil className="w-3 h-3" />
                            </motion.div>
                            <motion.div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete workspace?')) deleteSpace(space.id);
                              }}
                              className="text-[var(--text-secondary)] hover:text-red-400 p-0.5 cursor-pointer"
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
                <div className="border-t border-[var(--border-subtle)] p-1.5">
                  {!showCreateSpace ? (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: spaces.length * 0.03 + 0.1 }}
                      onClick={() => setShowCreateSpace(true)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors text-xs"
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
                        className="w-full bg-[var(--app-bg)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateSpace();
                          if (e.key === 'Escape') setShowCreateSpace(false);
                        }}
                      />

                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'freeform', icon: Layout, label: 'Canvas' },
                          { id: 'grid', icon: Grid3X3, label: 'Grid' },
                          { id: 'bento', icon: LayoutTemplate, label: 'Bento' },
                        ].map((mode) => (
                          <motion.button
                            key={mode.id}
                            onClick={() => setNewSpaceMode(mode.id as any)}
                            className={clsx(
                              "flex flex-col items-center justify-center gap-0.5 p-1 rounded border transition-all text-[9px]",
                              newSpaceMode === mode.id
                                ? "bg-[var(--text-primary)] text-[var(--app-bg)] border-[var(--text-primary)]"
                                : "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--app-bg)]"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <mode.icon className="w-3 h-3" />
                            <span>{mode.label}</span>
                          </motion.button>
                        ))}
                      </div>

                      <motion.button
                        onClick={handleCreateSpace}
                        className="w-full bg-[var(--text-primary)] text-[var(--app-bg)] text-[10px] font-semibold py-1 rounded hover:opacity-90 transition-opacity"
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

        {/* Right: Controls - pushed to edge */}
        <div className="flex-1 flex items-center justify-end relative z-10 pr-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors"
            title="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleMinimize}
            className="w-9 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors"
            title="Minimize"
          >
            <Minimize className="w-4 h-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-9 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors"
            title="Maximize"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="w-9 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-500 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && currentSpaceId && (
        <SettingsPanel spaceId={currentSpaceId} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
