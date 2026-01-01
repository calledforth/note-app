import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useThemeStore, NOTE_STYLES } from '../../stores/themeStore'
import { useBentoStore } from '../../stores/bentoStore'
import {
    Palette,
    Plus,
    Search,
    Layers,
    X,
    Minus,
    Maximize2,
    XCircle,
    ArrowLeft,
    Check,
    Grid3X3,
    Sparkles
} from 'lucide-react'
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

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
    onExecuteCommand: CommandHandler
}

// Mode for input states
type PaletteMode = 'commands' | 'new-workspace' | 'style-select'

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onExecuteCommand }) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [mode, setMode] = useState<PaletteMode>('commands')
    const [newWorkspaceName, setNewWorkspaceName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Store access
    const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)
    const workspaces = useBentoStore((state) => state.workspaces)

    // Build commands list dynamically
    const allCommands = useMemo((): CommandItem[] => {
        const commands: CommandItem[] = []

        // === NOTES ===
        commands.push({
            id: 'new-note',
            label: 'New Note',
            description: 'Create a new sticky note',
            icon: <Plus className="w-4 h-4" />,
            shortcut: 'Ctrl+N',
            category: 'Notes'
        })

        // === WORKSPACES ===
        commands.push({
            id: 'new-workspace',
            label: 'New Workspace',
            description: 'Create a new workspace',
            icon: <Layers className="w-4 h-4" />,
            category: 'Workspaces'
        })

        // Add all existing workspaces as switchable commands
        workspaces.forEach((workspace) => {
            commands.push({
                id: `workspace-${workspace.id}`,
                label: workspace.name,
                description: `Switch to ${workspace.name}`,
                icon: <Grid3X3 className="w-4 h-4" />,
                category: 'Workspaces'
            })
        })

        // === APPEARANCE ===
        // Toggle (cycles through styles)
        commands.push({
            id: 'toggle-style',
            label: 'Toggle Note Style',
            description: 'Cycle between available styles',
            icon: <Sparkles className="w-4 h-4" />,
            shortcut: 'Ctrl+Shift+T',
            category: 'Appearance'
        })

        // Individual style commands
        NOTE_STYLES.forEach((style) => {
            commands.push({
                id: `style-${style.key}`,
                label: `Set ${style.name}`,
                description: style.description,
                icon: <Palette className="w-4 h-4" />,
                category: 'Appearance',
                isActive: currentNoteStyle === style.key
            })
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

        return commands
    }, [workspaces, currentNoteStyle])

    // Filter commands based on search
    const filteredCommands = useMemo(() => {
        if (mode !== 'commands') return []

        return allCommands.filter(cmd =>
            cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cmd.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [allCommands, searchQuery, mode])

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
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen])

    // Handle command execution
    const executeCommand = (cmd: CommandItem) => {
        if (cmd.id === 'new-workspace') {
            // Enter new workspace name mode
            setMode('new-workspace')
            setNewWorkspaceName('')
            setTimeout(() => inputRef.current?.focus(), 50)
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
                    setTimeout(() => inputRef.current?.focus(), 50)
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

    // Get placeholder and input value based on mode
    const getInputProps = () => {
        switch (mode) {
            case 'new-workspace':
                return {
                    value: newWorkspaceName,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewWorkspaceName(e.target.value),
                    placeholder: 'Enter workspace name...'
                }
            default:
                return {
                    value: searchQuery,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        setSearchQuery(e.target.value)
                        setSelectedIndex(0)
                    },
                    placeholder: 'Type a command or search...'
                }
        }
    }

    const inputProps = getInputProps()

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
                        "w-full max-w-lg pointer-events-auto",
                        "animate-command-palette-in",
                        // Style-specific container styling
                        currentNoteStyle === 'zen-void'
                            ? "command-palette-zen-void"
                            : "command-palette-wabi-grid"
                    )}
                >
                    <div className={clsx(
                        "overflow-hidden shadow-2xl",
                        currentNoteStyle === 'zen-void'
                            ? "bg-[var(--void-bg)] border border-[var(--void-border)] rounded-md"
                            : "bg-[var(--wabi-bg)] border border-[var(--wabi-border)] rounded-xs"
                    )}>
                        {/* Search Input */}
                        <div className={clsx(
                            "flex items-center gap-2 px-3 py-2",
                            currentNoteStyle === 'zen-void'
                                ? "border-b border-[var(--void-border)]"
                                : "border-b border-[var(--wabi-border)]"
                        )}>
                            {/* Back button for sub-modes */}
                            {mode !== 'commands' && (
                                <button
                                    onClick={() => {
                                        setMode('commands')
                                        setSearchQuery('')
                                    }}
                                    className={clsx(
                                        "p-1 rounded transition-colors",
                                        currentNoteStyle === 'zen-void'
                                            ? "text-white/40 hover:text-white/60 hover:bg-white/5"
                                            : "text-[#555] hover:text-[#888] hover:bg-white/5"
                                    )}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            )}

                            {mode === 'commands' && (
                                <Search className={clsx(
                                    "w-4 h-4",
                                    currentNoteStyle === 'zen-void' ? "text-white/30" : "text-[var(--wabi-text-muted)]"
                                )} />
                            )}

                            {mode === 'new-workspace' && (
                                <Layers className={clsx(
                                    "w-4 h-4",
                                    currentNoteStyle === 'zen-void' ? "text-white/50" : "text-[var(--wabi-text)]"
                                )} />
                            )}

                            <input
                                ref={inputRef}
                                type="text"
                                {...inputProps}
                                className={clsx(
                                    "flex-1 bg-transparent border-none outline-none text-sm",
                                    currentNoteStyle === 'zen-void'
                                        ? "text-[var(--void-title)] placeholder:text-white/30 font-light"
                                        : "text-[var(--wabi-text)] placeholder:text-[var(--wabi-text-muted)]"
                                )}
                                style={{
                                    fontFamily: currentNoteStyle === 'zen-void'
                                        ? "'Inter', sans-serif"
                                        : "'JetBrains Mono', monospace"
                                }}
                            />
                            <button
                                onClick={onClose}
                                className={clsx(
                                    "p-1 rounded transition-colors",
                                    currentNoteStyle === 'zen-void'
                                        ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                                        : "text-[#555] hover:text-[#888] hover:bg-white/5"
                                )}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="max-h-[325px] overflow-y-auto">
                            {/* Commands Mode */}
                            {mode === 'commands' && (
                                <>
                                    {Object.keys(groupedCommands).length === 0 ? (
                                        <div className={clsx(
                                            "px-3 py-6 text-center text-xs",
                                            currentNoteStyle === 'zen-void' ? "text-white/30" : "text-[var(--wabi-text-muted)]"
                                        )}>
                                            No commands found
                                        </div>
                                    ) : (
                                        Object.entries(groupedCommands).map(([category, commands]) => (
                                            <div key={category} className="pt-2 first:pt-0">
                                                {/* Category Header - Spotlight style (no background) */}
                                                <div className={clsx(
                                                    "px-3 pt-2 pb-1",
                                                    currentNoteStyle === 'zen-void'
                                                        ? "text-white/40 text-xs font-light italic tracking-wide"
                                                        : "text-[var(--wabi-title)] text-[10px] uppercase tracking-[0.15em]"
                                                )}
                                                    style={{ fontFamily: currentNoteStyle === 'zen-void' ? "'Inter', sans-serif" : "'JetBrains Mono', monospace" }}
                                                >
                                                    {category}
                                                </div>

                                                {/* Commands */}
                                                {commands.map((cmd) => {
                                                    const currentFlatIndex = getFlatIndex()
                                                    const isSelected = currentFlatIndex === selectedIndex

                                                    return (
                                                        <button
                                                            key={cmd.id}
                                                            className={clsx(
                                                                "w-full flex items-center gap-2 px-3 py-2 transition-colors text-left",
                                                                currentNoteStyle === 'zen-void'
                                                                    ? [
                                                                        isSelected ? "bg-white/5" : "bg-transparent",
                                                                        "hover:bg-white/5"
                                                                    ]
                                                                    : [
                                                                        isSelected ? "bg-[#0c0c0b]" : "bg-transparent",
                                                                        "hover:bg-[#0c0c0b]"
                                                                    ]
                                                            )}
                                                            onClick={() => executeCommand(cmd)}
                                                        >
                                                            {/* Icon */}
                                                            <span className={clsx(
                                                                currentNoteStyle === 'zen-void'
                                                                    ? "text-white/40"
                                                                    : "text-[#666]"
                                                            )}>
                                                                {cmd.icon}
                                                            </span>

                                                            {/* Label & Description */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className={clsx(
                                                                    "truncate",
                                                                    currentNoteStyle === 'zen-void'
                                                                        ? "text-sm text-[var(--void-title)] font-light"
                                                                        : "text-xs text-[var(--wabi-text)]"
                                                                )}
                                                                    style={{
                                                                        fontFamily: currentNoteStyle === 'zen-void'
                                                                            ? "'Inter', sans-serif"
                                                                            : "'JetBrains Mono', monospace"
                                                                    }}
                                                                >
                                                                    {cmd.label}
                                                                </div>
                                                                {cmd.description && (
                                                                    <div className={clsx(
                                                                        "truncate mt-0.5",
                                                                        currentNoteStyle === 'zen-void'
                                                                            ? "text-xs text-white/25"
                                                                            : "text-[10px] text-[var(--wabi-text-muted)]"
                                                                    )}
                                                                        style={{ fontFamily: currentNoteStyle === 'zen-void' ? "'Inter', sans-serif" : "'JetBrains Mono', monospace" }}
                                                                    >
                                                                        {cmd.description}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Active indicator (for current style) */}
                                                            {cmd.isActive && (
                                                                <Check className={clsx(
                                                                    "w-4 h-4",
                                                                    currentNoteStyle === 'zen-void'
                                                                        ? "text-white/60"
                                                                        : "text-[#888]"
                                                                )} />
                                                            )}

                                                            {/* Shortcut */}
                                                            {cmd.shortcut && (
                                                                <div className={clsx(
                                                                    "flex items-center gap-1 text-[10px]",
                                                                    currentNoteStyle === 'zen-void'
                                                                        ? "text-white/20"
                                                                        : "text-[#444]"
                                                                )}
                                                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                                                >
                                                                    {cmd.shortcut.split('+').map((key, i) => (
                                                                        <React.Fragment key={key}>
                                                                            {i > 0 && <span>+</span>}
                                                                            <kbd className={clsx(
                                                                                "px-1.5 py-0.5 rounded",
                                                                                currentNoteStyle === 'zen-void'
                                                                                    ? "bg-white/5 border border-white/10"
                                                                                    : "bg-[#111] border border-[#222]"
                                                                            )}>
                                                                                {key}
                                                                            </kbd>
                                                                        </React.Fragment>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ))
                                    )}
                                </>
                            )}

                            {/* New Workspace Mode */}
                            {mode === 'new-workspace' && (
                                <div className="px-3 py-4">
                                    <div className={clsx(
                                        "text-xs mb-3",
                                        currentNoteStyle === 'zen-void' ? "text-white/40" : "text-[var(--wabi-text-muted)]"
                                    )}
                                        style={{ fontFamily: currentNoteStyle === 'zen-void' ? "'Inter', sans-serif" : "'JetBrains Mono', monospace" }}
                                    >
                                        Enter a name for your new workspace and press Enter
                                    </div>
                                    <div className={clsx(
                                        "flex items-center gap-2 px-3 py-2 rounded",
                                        currentNoteStyle === 'zen-void'
                                            ? "bg-white/5 border border-white/10"
                                            : "bg-[#0c0c0b] border border-[#222]"
                                    )}>
                                        <Grid3X3 className={clsx(
                                            "w-4 h-4",
                                            currentNoteStyle === 'zen-void' ? "text-white/40" : "text-[#666]"
                                        )} />
                                        <span className={clsx(
                                            "text-sm",
                                            currentNoteStyle === 'zen-void'
                                                ? "text-[var(--void-title)] font-light"
                                                : "text-[var(--wabi-text)]"
                                        )}
                                            style={{ fontFamily: currentNoteStyle === 'zen-void' ? "'Inter', sans-serif" : "'JetBrains Mono', monospace" }}
                                        >
                                            {newWorkspaceName || 'New Workspace'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Simplified */}
                        <div className={clsx(
                            "flex items-center justify-center gap-6 px-3 py-2 text-[10px]",
                            currentNoteStyle === 'zen-void'
                                ? "border-t border-[var(--void-border)] text-white/30"
                                : "border-t border-[var(--wabi-border)] text-[var(--wabi-text-muted)]"
                        )}
                            style={{ fontFamily: currentNoteStyle === 'zen-void' ? "'Inter', sans-serif" : "'JetBrains Mono', monospace" }}
                        >
                            {mode === 'commands' && (
                                <>
                                    <span className="flex items-center gap-1.5">
                                        <span className={clsx(
                                            "opacity-60",
                                            currentNoteStyle === 'zen-void' ? "text-white/50" : "text-[var(--wabi-text)]"
                                        )}>↑↓</span>
                                        navigate
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className={clsx(
                                            "opacity-60",
                                            currentNoteStyle === 'zen-void' ? "text-white/50" : "text-[var(--wabi-text)]"
                                        )}>↵</span>
                                        select
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className={clsx(
                                            "opacity-60",
                                            currentNoteStyle === 'zen-void' ? "text-white/50" : "text-[var(--wabi-text)]"
                                        )}>esc</span>
                                        close
                                    </span>
                                </>
                            )}
                            {mode === 'new-workspace' && (
                                <>
                                    <span className="flex items-center gap-1.5">
                                        <span className={clsx(
                                            "opacity-60",
                                            currentNoteStyle === 'zen-void' ? "text-white/50" : "text-[var(--wabi-text)]"
                                        )}>↵</span>
                                        create
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className={clsx(
                                            "opacity-60",
                                            currentNoteStyle === 'zen-void' ? "text-white/50" : "text-[var(--wabi-text)]"
                                        )}>esc</span>
                                        back
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
