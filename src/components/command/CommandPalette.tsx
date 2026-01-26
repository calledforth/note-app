import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useThemeStore, NOTE_STYLES, EDITOR_FONTS } from '../../stores/themeStore'
import { useBentoStore } from '../../stores/bentoStore'
import {
    Check,
    Info,
    Layers,
    LayersPlus,
    Maximize2,
    Minus,
    NotebookPen,
    Palette,
    Pencil,
    Search,
    Settings2,
    Sunrise,
    Trash2,
    Type,
    XCircle
} from 'lucide-react'

// Get app version from package.json (injected at build time via Vite)
const APP_VERSION = __APP_VERSION__ || '0.0.0'
import clsx from 'clsx'

// Command item types
interface CommandItem {
    id: string
    label: string
    description?: string
    icon: React.ReactNode
    shortcut?: string
    category: string
    isActive?: boolean // For showing current selection (e.g., current style)
    hasSubcommands?: boolean // For commands that open a sub-menu
}

// Command execution handler type
export type CommandHandler = (commandId: string, payload?: unknown) => void

export type CommandPaletteVariant = 'all' | 'spaces'

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
    onExecuteCommand: CommandHandler
    variant?: CommandPaletteVariant
}

// Mode for input states
type PaletteMode = 'commands' | 'new-workspace' | 'rename-workspace' | 'confirm-delete' | 'font' | 'theme'

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    onExecuteCommand,
    variant = 'all',
}) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [mode, setMode] = useState<PaletteMode>('commands')
    const [newWorkspaceName, setNewWorkspaceName] = useState('')
    const [renameWorkspaceName, setRenameWorkspaceName] = useState('')
    const searchInputRef = useRef<HTMLInputElement>(null)
    const workspaceInputRef = useRef<HTMLInputElement>(null)

    // Store access
    const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)
    const currentEditorFont = useThemeStore((state) => state.currentEditorFont)
    const workspaces = useBentoStore((state) => state.workspaces)
    const currentWorkspaceId = useBentoStore((state) => state.currentWorkspaceId)
    const currentWorkspace = useMemo(
        () => workspaces.find((w) => w.id === currentWorkspaceId) || null,
        [workspaces, currentWorkspaceId]
    )

    // Get the font family string for the current editor font
    const currentFontFamily = useMemo(() => {
        const font = EDITOR_FONTS.find(f => f.key === currentEditorFont)
        return font?.fontFamily || "'Geist', system-ui, sans-serif"
    }, [currentEditorFont])

    // Build commands list dynamically
    const allCommands = useMemo((): CommandItem[] => {
        const commands: CommandItem[] = []

        // Spaces picker variant: only show create + spaces destinations
        if (variant === 'spaces') {
            commands.push({
                id: 'new-workspace',
                label: 'Create new workspace',
                description: 'Create a fresh workspace for notes',
                icon: <LayersPlus className="w-4 h-4" />,
                category: '__top__',
            })

            if (currentWorkspaceId) {
                commands.push({
                    id: 'rename-workspace',
                    label: 'Rename workspace',
                    description: 'Edit the current workspace name',
                    icon: <Pencil className="w-4 h-4" />,
                    category: '__top__',
                })
                commands.push({
                    id: 'delete-workspace',
                    label: 'Delete workspace',
                    description: 'Remove the current workspace',
                    icon: <Trash2 className="w-4 h-4" />,
                    category: '__top__',
                })
            }

            workspaces.forEach((workspace) => {
                commands.push({
                    id: `workspace-${workspace.id}`,
                    label: workspace.name,
                    description: `Switch to ${workspace.name}`,
                    icon: <Layers className="w-4 h-4" />,
                    category: 'Spaces',
                    isActive: workspace.id === currentWorkspaceId,
                })
            })
            commands.push({
                id: 'show-mantra',
                label: 'Mantra',
                description: 'Open morning mantra ritual',
                icon: <Sunrise className="w-4 h-4" />,
                category: 'Spaces',
            })
            commands.push({
                id: 'open-settings',
                label: 'Settings',
                description: 'Open application settings',
                icon: <Settings2 className="w-4 h-4" />,
                category: 'Spaces',
            })

            return commands
        }

        // === SPACES (workspaces, mantra, settings - places you go to) ===
        workspaces.forEach((workspace) => {
            commands.push({
                id: `workspace-${workspace.id}`,
                label: workspace.name,
                description: `Switch to ${workspace.name}`,
                icon: <Layers className="w-4 h-4" />,
                category: 'Spaces',
                isActive: workspace.id === currentWorkspaceId
            })
        })
        commands.push({
            id: 'show-mantra',
            label: 'Mantra',
            description: 'Open morning mantra ritual',
            icon: <Sunrise className="w-4 h-4" />,
            category: 'Spaces'
        })
        commands.push({
            id: 'open-settings',
            label: 'Settings',
            description: 'Open application settings',
            icon: <Settings2 className="w-4 h-4" />,
            category: 'Spaces'
        })

        // === ACTIONS (things you do) ===
        commands.push({
            id: 'new-workspace',
            label: 'Create new workspace',
            description: 'Create a fresh workspace for notes',
            icon: <LayersPlus className="w-4 h-4" />,
            category: 'Actions'
        })
        if (currentWorkspaceId) {
            commands.push({
                id: 'rename-workspace',
                label: 'Rename workspace',
                description: 'Edit the current workspace name',
                icon: <Pencil className="w-4 h-4" />,
                category: 'Actions'
            })
            commands.push({
                id: 'delete-workspace',
                label: 'Delete workspace',
                description: 'Remove the current workspace',
                icon: <Trash2 className="w-4 h-4" />,
                category: 'Actions'
            })
        }
        commands.push({
            id: 'new-note',
            label: 'New Note',
            description: 'Create a new sticky note',
            icon: <NotebookPen className="w-4 h-4" />,
            shortcut: 'Ctrl+N',
            category: 'Actions'
        })
        commands.push({
            id: 'open-font',
            label: 'Change font',
            description: 'Choose editor font',
            icon: <Type className="w-4 h-4" />,
            category: 'Actions'
        })
        commands.push({
            id: 'open-theme',
            label: 'Change theme',
            description: 'Switch note style',
            icon: <Palette className="w-4 h-4" />,
            category: 'Actions'
        })

        // === WINDOW ===
        commands.push({
            id: 'window-minimize',
            label: 'Minimize Window',
            description: 'Minimize the application',
            icon: <Minus className="w-4 h-4" />,
            category: 'Window'
        })
        commands.push({
            id: 'window-maximize',
            label: 'Maximize Window',
            description: 'Maximize or restore the window',
            icon: <Maximize2 className="w-4 h-4" />,
            category: 'Window'
        })
        commands.push({
            id: 'window-close',
            label: 'Close Window',
            description: 'Close the application',
            icon: <XCircle className="w-4 h-4" />,
            category: 'Window'
        })

        // === ABOUT ===
        commands.push({
            id: 'about-version',
            label: `Version ${APP_VERSION}`,
            description: 'Current application version',
            icon: <Info className="w-4 h-4" />,
            category: 'About'
        })

        return commands
    }, [workspaces, currentWorkspaceId, variant])

    // Filter commands based on search
    const filteredCommands = useMemo(() => {
        if (mode !== 'commands') return []

        const query = searchQuery.toLowerCase()

        // For the spaces picker, keep pinned commands visible regardless of search.
        if (variant === 'spaces') {
            const pinned = allCommands.filter((cmd) => cmd.category === '__top__')
            const rest = allCommands
                .filter((cmd) => cmd.category !== '__top__')
                .filter(
                    (cmd) =>
                        cmd.label.toLowerCase().includes(query) ||
                        cmd.description?.toLowerCase().includes(query) ||
                        cmd.category.toLowerCase().includes(query)
                )
            return [...pinned, ...rest]
        }

        return allCommands.filter(
            (cmd) =>
                cmd.label.toLowerCase().includes(query) ||
                cmd.description?.toLowerCase().includes(query) ||
                cmd.category.toLowerCase().includes(query)
        )
    }, [allCommands, searchQuery, mode, variant])

    // Group commands by category
    const groupedCommands = useMemo(() => {
        return filteredCommands.reduce((acc, cmd) => {
            if (!acc[cmd.category]) acc[cmd.category] = []
            acc[cmd.category].push(cmd)
            return acc
        }, {} as Record<string, CommandItem[]>)
    }, [filteredCommands])

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('')
            setSelectedIndex(0)
            setMode('commands')
            setNewWorkspaceName('')
            setTimeout(() => searchInputRef.current?.focus(), 50)
        }
    }, [isOpen])

    useEffect(() => {
        if (mode === 'new-workspace') {
            setTimeout(() => workspaceInputRef.current?.focus(), 50)
        }
    }, [mode])

    // Handle command execution
    const executeCommand = (cmd: CommandItem) => {
        if (cmd.id === 'new-workspace') {
            // Enter new workspace name mode
            setMode('new-workspace')
            setNewWorkspaceName('')
            return
        }
        if (cmd.id === 'rename-workspace') {
            setMode('rename-workspace')
            setRenameWorkspaceName(currentWorkspace?.name || '')
            return
        }
        if (cmd.id === 'delete-workspace') {
            setMode('confirm-delete')
            return
        }
        if (cmd.id === 'open-font') {
            setMode('font')
            return
        }
        if (cmd.id === 'open-theme') {
            setMode('theme')
            return
        }

        // Execute the command and close
        onExecuteCommand(cmd.id)
        onClose()
    }

    // Handle new workspace creation
    const handleCreateWorkspace = () => {
        const name = newWorkspaceName.trim()
        if (name) {
            onExecuteCommand('create-workspace', { name })
            onClose()
        }
    }

    const handleRenameWorkspace = () => {
        const name = renameWorkspaceName.trim()
        if (name && currentWorkspaceId) {
            onExecuteCommand('rename-workspace', { id: currentWorkspaceId, name })
            onClose()
        }
    }

    const handleDeleteWorkspace = () => {
        if (currentWorkspaceId) {
            onExecuteCommand('delete-workspace', { id: currentWorkspaceId })
            onClose()
        }
    }

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                if (mode !== 'commands') {
                    // Go back to commands mode
                    setMode('commands')
                    setSearchQuery('')
                    setTimeout(() => searchInputRef.current?.focus(), 50)
                } else {
                    onClose()
                }
            } else if (e.key === 'ArrowDown' && mode === 'commands') {
                e.preventDefault()
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
            } else if (e.key === 'ArrowUp' && mode === 'commands') {
                e.preventDefault()
                setSelectedIndex(prev => Math.max(prev - 1, 0))
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (mode === 'new-workspace') {
                    handleCreateWorkspace()
                } else if (mode === 'rename-workspace') {
                    handleRenameWorkspace()
                } else if (mode === 'confirm-delete') {
                    handleDeleteWorkspace()
                } else if (mode === 'commands' && filteredCommands[selectedIndex]) {
                    executeCommand(filteredCommands[selectedIndex])
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, filteredCommands, selectedIndex, onClose, mode, newWorkspaceName])

    if (!isOpen) return null

    // Get flat index for highlighting
    let flatIndex = 0
    const getFlatIndex = () => flatIndex++

    const styleSwatches: Record<string, string> = {
        'wabi-grid': 'var(--wabi-bg)',
        'zen-void': 'var(--void-bg)',
        'test-lab': 'var(--lab-bg)'
    }

    const renderShortcut = (shortcut: string) => {
        return shortcut.split('+').map((key, index) => (
            <span key={`${shortcut}-${index}`} className="kbd">
                {key}
            </span>
        ))
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in"
                onClick={onClose}
            />

            {/* Command Palette Centering Wrapper */}
            <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
                {/* Command Palette Container */}
                <div
                    className={clsx(
                        "w-full max-w-lg pointer-events-auto animate-command-open",
                        currentNoteStyle === 'zen-void'
                            ? "command-palette-zen-void"
                            : currentNoteStyle === 'test-lab'
                                ? "command-palette-test-lab"
                                : "command-palette-wabi-grid"
                    )}
                >
                    <div className="overflow-hidden rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] text-[var(--cp-text)] shadow-2xl">
                        {mode === 'commands' && (
                            <>
                                <div className="border-b border-[var(--cp-border)]">
                                    <div className="flex items-center gap-2 px-3 py-2">
                                        <Search className="h-4 w-4 text-[var(--cp-muted)]" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                setSelectedIndex(0)
                                            }}
                                            placeholder={variant === 'spaces' ? 'Search spaces...' : 'Search workspaces or actions...'}
                                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-muted)]"
                                            style={{ fontFamily: currentFontFamily }}
                                        />
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto pt-1.5 pb-2">
                                    {Object.keys(groupedCommands).length === 0 ? (
                                        <div className="py-6 text-center text-sm text-[var(--cp-muted)]">
                                            No results found.
                                        </div>
                                    ) : (
                                        Object.entries(groupedCommands).map(([category, commands], groupIndex) => (
                                            <div key={category}>
                                                {/* Separator between groups */}
                                                {groupIndex > 0 && (
                                                    <div className="h-px bg-[var(--cp-border)] mx-2 my-1.5" />
                                                )}
                                                
                                                {/* Category heading - normal case like reference */}
                                                {category !== '__top__' && (
                                                    <div className="px-3 py-1 text-xs text-[var(--cp-muted)]">
                                                        {category}
                                                    </div>
                                                )}

                                                {commands.map((cmd) => {
                                                    const currentFlatIndex = getFlatIndex()
                                                    const isSelected = currentFlatIndex === selectedIndex
                                                    // Show keyboard shortcut for first 9 workspace items
                                                    const isWorkspaceItem = cmd.id.startsWith('workspace-')
                                                    const workspaceIndex = isWorkspaceItem ? workspaces.findIndex(w => `workspace-${w.id}` === cmd.id) : -1
                                                    const showShortcut = isWorkspaceItem && workspaceIndex >= 0 && workspaceIndex < 9

                                                    return (
                                                        <button
                                                            key={cmd.id}
                                                            className={clsx(
                                                                "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                                                "hover-glow press-effect",
                                                                isSelected ? "bg-[var(--cp-glow-soft)]" : "bg-transparent"
                                                            )}
                                                            onClick={() => executeCommand(cmd)}
                                                        >
                                                            <span className="text-[var(--cp-muted)]">
                                                                {cmd.icon}
                                                            </span>
                                                            <span className="flex-1 text-sm text-[var(--cp-text)] truncate">
                                                                {cmd.label}
                                                            </span>
                                                            {cmd.isActive && (
                                                                <Check className="h-4 w-4 text-[var(--cp-muted)]" />
                                                            )}
                                                            {showShortcut && (
                                                                <span className="kbd ml-2">⌘{workspaceIndex + 1}</span>
                                                            )}
                                                            {cmd.shortcut && (
                                                                <div className="flex items-center gap-1 ml-2">
                                                                    {renderShortcut(cmd.shortcut)}
                                                                </div>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {mode === 'new-workspace' && (
                            <div className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--cp-muted)]">
                                        <LayersPlus className="h-4 w-4" />
                                    </span>
                                    <input
                                        ref={workspaceInputRef}
                                        type="text"
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleCreateWorkspace()
                                            if (e.key === "Escape") setMode("commands")
                                        }}
                                        placeholder="New workspace name..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-muted)]"
                                        style={{ fontFamily: currentFontFamily }}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="kbd">↵</span>
                                        <span className="kbd">esc</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'rename-workspace' && (
                            <div className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--cp-muted)]">
                                        <Pencil className="h-4 w-4" />
                                    </span>
                                    <input
                                        ref={workspaceInputRef}
                                        type="text"
                                        value={renameWorkspaceName}
                                        onChange={(e) => setRenameWorkspaceName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRenameWorkspace()
                                            if (e.key === "Escape") setMode("commands")
                                        }}
                                        placeholder="Rename workspace..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-muted)]"
                                        style={{ fontFamily: currentFontFamily }}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="kbd">↵</span>
                                        <span className="kbd">esc</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'confirm-delete' && (
                            <div className="px-3 py-2.5">
                                <div className="flex items-center gap-2 text-[var(--cp-text)]">
                                    <div className="text-sm font-medium truncate">
                                        Delete “{currentWorkspace?.name || 'workspace'}”?
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setMode('commands')}
                                        className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[var(--cp-text)] transition-colors hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteWorkspace}
                                        className="rounded-md bg-red-700 px-2.5 py-1 text-xs text-white transition-colors hover:bg-red-800"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode === 'font' && (
                            <>
                                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--cp-border)]">
                                    <span className="text-xs text-[var(--cp-muted)]">Font</span>
                                    <button
                                        onClick={() => setMode('commands')}
                                        className="text-xs text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors"
                                    >
                                        esc
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {EDITOR_FONTS.map((font) => (
                                        <button
                                            key={font.key}
                                            className={clsx(
                                                "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                                "hover-glow press-effect",
                                                font.key === currentEditorFont ? "bg-[var(--cp-glow-soft)]" : "bg-transparent"
                                            )}
                                            onClick={() => {
                                                onExecuteCommand(`font-${font.key}`)
                                                onClose()
                                            }}
                                            style={{ fontFamily: font.fontFamily }}
                                        >
                                            <span className="text-[var(--cp-muted)] text-sm">Aa</span>
                                            <span className="flex-1 text-sm">{font.name}</span>
                                            {currentEditorFont === font.key && (
                                                <Check className="h-3 w-3 text-[var(--cp-muted)]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {mode === 'theme' && (
                            <>
                                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--cp-border)]">
                                    <span className="text-xs text-[var(--cp-muted)]">Theme</span>
                                    <button
                                        onClick={() => setMode('commands')}
                                        className="text-xs text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors"
                                    >
                                        esc
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {NOTE_STYLES.map((style) => (
                                        <button
                                            key={style.key}
                                            className={clsx(
                                                "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                                "hover-glow press-effect",
                                                style.key === currentNoteStyle ? "bg-[var(--cp-glow-soft)]" : "bg-transparent"
                                            )}
                                            onClick={() => {
                                                onExecuteCommand(`style-${style.key}`)
                                                onClose()
                                            }}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full border border-[var(--cp-border-subtle)]"
                                                style={{ background: styleSwatches[style.key] || 'var(--cp-bg)' }}
                                            />
                                            <span className="flex-1 text-sm">{style.name}</span>
                                            {currentNoteStyle === style.key && (
                                                <Check className="h-3 w-3 text-[var(--cp-muted)]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
