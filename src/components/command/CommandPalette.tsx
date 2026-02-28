import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useThemeStore, NOTE_STYLES, EDITOR_FONTS } from '../../stores/themeStore'
import { useBentoStore } from '../../stores/bentoStore'
import { FIXED_TODO_WORKSPACE_ID, isFixedWorkspace } from '../../constants/workspaces'
import {
    Check,
    CheckSquare,
    Info,
    RefreshCw,
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
type UpdateCheckStatus = 'idle' | 'checking' | 'up-to-date' | 'available' | 'error'

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
    const [targetWorkspaceIdForAction, setTargetWorkspaceIdForAction] = useState<string | null>(null)
    const [updateCheckStatus, setUpdateCheckStatus] = useState<UpdateCheckStatus>('idle')
    const clearUpdateStatusTimerRef = useRef<number | null>(null)
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

    const clearUpdateStatusTimer = () => {
        if (clearUpdateStatusTimerRef.current !== null) {
            window.clearTimeout(clearUpdateStatusTimerRef.current)
            clearUpdateStatusTimerRef.current = null
        }
    }

    const focusSearchInput = useCallback(() => {
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus()
        })
    }, [])

    const focusWorkspaceInput = useCallback(() => {
        window.requestAnimationFrame(() => {
            workspaceInputRef.current?.focus()
        })
    }, [])

    const scheduleUpdateStatusReset = (delayMs: number) => {
        clearUpdateStatusTimer()
        clearUpdateStatusTimerRef.current = window.setTimeout(() => {
            setUpdateCheckStatus('idle')
            clearUpdateStatusTimerRef.current = null
        }, delayMs)
    }

    useEffect(() => {
        const updater = window.electronAPI?.updater
        if (!updater) return

        const handleChecking = () => {
            clearUpdateStatusTimer()
            setUpdateCheckStatus('checking')
        }

        const handleAvailable = () => {
            clearUpdateStatusTimer()
            setUpdateCheckStatus('available')
        }

        const handleNotAvailable = () => {
            setUpdateCheckStatus('up-to-date')
            scheduleUpdateStatusReset(2200)
        }

        const handleError = () => {
            setUpdateCheckStatus('error')
            scheduleUpdateStatusReset(2800)
        }

        updater.onCheckingForUpdate(handleChecking)
        updater.onUpdateAvailable(handleAvailable)
        updater.onUpdateNotAvailable(handleNotAvailable)
        updater.onError(handleError)

        return () => {
            clearUpdateStatusTimer()
        }
    }, [])

    useEffect(() => {
        if (updateCheckStatus !== 'checking') return

        const timeoutId = window.setTimeout(() => {
            setUpdateCheckStatus('error')
            scheduleUpdateStatusReset(2800)
        }, 10000)

        return () => window.clearTimeout(timeoutId)
    }, [updateCheckStatus])

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

            if (currentWorkspaceId && !isFixedWorkspace(currentWorkspaceId)) {
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

            commands.push({
                id: `workspace-${FIXED_TODO_WORKSPACE_ID}`,
                label: 'Todo',
                description: 'Switch to Todo',
                icon: <CheckSquare className="w-4 h-4" />,
                category: 'Spaces',
                isActive: currentWorkspaceId === FIXED_TODO_WORKSPACE_ID,
            })
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
        commands.push({
            id: `workspace-${FIXED_TODO_WORKSPACE_ID}`,
            label: 'Todo',
            description: 'Switch to Todo',
            icon: <CheckSquare className="w-4 h-4" />,
            category: 'Spaces',
            isActive: currentWorkspaceId === FIXED_TODO_WORKSPACE_ID,
        })
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
        if (currentWorkspaceId && !isFixedWorkspace(currentWorkspaceId)) {
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
        const checkForUpdatesCommand =
            updateCheckStatus === 'checking'
                ? {
                    description: 'Checking for updates...',
                    icon: <RefreshCw className="w-4 h-4 animate-spin" />,
                }
                : updateCheckStatus === 'up-to-date'
                    ? {
                        description: 'You are up to date',
                        icon: <Check className="w-4 h-4" />,
                    }
                    : updateCheckStatus === 'available'
                        ? {
                            description: 'Update available - see toast for actions',
                            icon: <RefreshCw className="w-4 h-4" />,
                        }
                        : updateCheckStatus === 'error'
                            ? {
                                description: 'Update check failed - try again',
                                icon: <RefreshCw className="w-4 h-4" />,
                            }
                            : {
                                description: 'Check if a new version is available',
                                icon: <RefreshCw className="w-4 h-4" />,
                            }

        commands.push({
            id: 'check-for-updates',
            label: 'Check for updates',
            description: checkForUpdatesCommand.description,
            icon: checkForUpdatesCommand.icon,
            category: 'About'
        })
        commands.push({
            id: 'about-version',
            label: `Version ${APP_VERSION}`,
            description: 'Current application version',
            icon: <Info className="w-4 h-4" />,
            category: 'About'
        })

        return commands
    }, [workspaces, currentWorkspaceId, variant, updateCheckStatus])

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

    const workspaceShortcutIndexById = useMemo(() => {
        const indexById = new Map<string, number>()
        workspaces.forEach((workspace, index) => {
            indexById.set(workspace.id, index)
        })
        return indexById
    }, [workspaces])

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('')
            setSelectedIndex(0)
            setMode('commands')
            setNewWorkspaceName('')
            setTargetWorkspaceIdForAction(null)
            clearUpdateStatusTimer()
            setUpdateCheckStatus('idle')
            focusSearchInput()
        }
    }, [isOpen, focusSearchInput])

    useEffect(() => {
        if (mode === 'new-workspace' || mode === 'rename-workspace') {
            focusWorkspaceInput()
        }
    }, [mode, focusWorkspaceInput])

    // Handle command execution
    const executeCommand = (cmd: CommandItem) => {
        if (cmd.id === 'new-workspace') {
            // Enter new workspace name mode
            setMode('new-workspace')
            setNewWorkspaceName('')
            return
        }
        if (cmd.id === 'rename-workspace') {
            setTargetWorkspaceIdForAction(null)
            setMode('rename-workspace')
            setRenameWorkspaceName(currentWorkspace?.name || '')
            return
        }
        if (cmd.id === 'delete-workspace') {
            setTargetWorkspaceIdForAction(null)
            setMode('confirm-delete')
            return
        }
        if (cmd.id === 'open-font') {
            setMode('font')
            const fontIdx = EDITOR_FONTS.findIndex((f) => f.key === currentEditorFont)
            setSelectedIndex(fontIdx >= 0 ? fontIdx : 0)
            return
        }
        if (cmd.id === 'open-theme') {
            setMode('theme')
            const themeIdx = NOTE_STYLES.findIndex((s) => s.key === currentNoteStyle)
            setSelectedIndex(themeIdx >= 0 ? themeIdx : 0)
            return
        }
        if (cmd.id === 'check-for-updates') {
            clearUpdateStatusTimer()
            setUpdateCheckStatus('checking')
            onExecuteCommand(cmd.id)
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

    const targetWorkspaceId = targetWorkspaceIdForAction ?? currentWorkspaceId
    const targetWorkspace = useMemo(
        () => workspaces.find((w) => w.id === targetWorkspaceId) || null,
        [workspaces, targetWorkspaceId]
    )

    const handleRenameWorkspace = () => {
        const name = renameWorkspaceName.trim()
        if (name && targetWorkspaceId) {
            onExecuteCommand('rename-workspace', { id: targetWorkspaceId, name })
            onClose()
        }
    }

    const handleDeleteWorkspace = () => {
        if (targetWorkspaceId) {
            onExecuteCommand('delete-workspace', { id: targetWorkspaceId })
            onClose()
        }
    }

    const enterRenameForWorkspace = (workspaceId: string) => (e: React.MouseEvent) => {
        e.stopPropagation()
        const ws = workspaces.find((w) => w.id === workspaceId)
        if (ws) {
            setTargetWorkspaceIdForAction(workspaceId)
            setMode('rename-workspace')
            setRenameWorkspaceName(ws.name)
        }
    }

    const enterDeleteForWorkspace = (workspaceId: string) => (e: React.MouseEvent) => {
        e.stopPropagation()
        setTargetWorkspaceIdForAction(workspaceId)
        setMode('confirm-delete')
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
                    setTargetWorkspaceIdForAction(null)
                    setSearchQuery('')
                    setSelectedIndex(0)
                    focusSearchInput()
                } else {
                    onClose()
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (mode === 'commands') {
                    setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
                } else if (mode === 'font') {
                    setSelectedIndex(prev => Math.min(prev + 1, EDITOR_FONTS.length - 1))
                } else if (mode === 'theme') {
                    setSelectedIndex(prev => Math.min(prev + 1, NOTE_STYLES.length - 1))
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                if (mode === 'commands') {
                    setSelectedIndex(prev => Math.max(prev - 1, 0))
                } else if (mode === 'font') {
                    setSelectedIndex(prev => Math.max(prev - 1, 0))
                } else if (mode === 'theme') {
                    setSelectedIndex(prev => Math.max(prev - 1, 0))
                }
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
                } else if (mode === 'font' && EDITOR_FONTS[selectedIndex]) {
                    onExecuteCommand(`font-${EDITOR_FONTS[selectedIndex].key}`)
                    onClose()
                } else if (mode === 'theme' && NOTE_STYLES[selectedIndex]) {
                    onExecuteCommand(`style-${NOTE_STYLES[selectedIndex].key}`)
                    onClose()
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, filteredCommands, selectedIndex, onClose, mode, newWorkspaceName, focusSearchInput])

    if (!isOpen) return null

    // Get flat index for highlighting
    let flatIndex = 0
    const getFlatIndex = () => flatIndex++

    const styleSwatches: Record<string, string> = {
        'dark': 'var(--dark-bg)',
        'light': 'var(--light-bg)',
        'dim': 'var(--dim-bg)',
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
                className="fixed inset-0 bg-black/60 z-100 animate-fade-in"
                onClick={onClose}
            />

            {/* Command Palette Centering Wrapper */}
            <div className="fixed inset-0 z-101 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
                {/* Command Palette Container */}
                <div
                    className={clsx(
                        "w-full max-w-lg pointer-events-auto animate-command-open",
                        currentNoteStyle === 'light'
                            ? "command-palette-light"
                            : currentNoteStyle === 'dim'
                                ? "command-palette-dim"
                                : currentNoteStyle === 'test-lab'
                                    ? "command-palette-test-lab"
                                    : "command-palette-dark"
                    )}
                >
                    <div className="overflow-hidden rounded-lg border border-(--cp-border) bg-(--cp-bg) text-(--cp-text) shadow-2xl">
                        {mode === 'commands' && (
                            <>
                                <div className="border-b border-(--cp-border)">
                                    <div className="flex items-center gap-2 px-3 py-2">
                                        <Search className="h-4 w-4 text-(--cp-muted)" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                setSelectedIndex(0)
                                            }}
                                            placeholder={variant === 'spaces' ? 'Search spaces...' : 'Search workspaces or actions...'}
                                            className="flex-1 bg-transparent border-none outline-none text-sm text-(--cp-text) placeholder:text-(--cp-muted)"
                                            style={{ fontFamily: currentFontFamily }}
                                        />
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto pt-1.5 pb-2">
                                    {Object.keys(groupedCommands).length === 0 ? (
                                        <div className="py-6 text-center text-sm text-(--cp-muted)">
                                            No results found.
                                        </div>
                                    ) : (
                                        Object.entries(groupedCommands).map(([category, commands], groupIndex) => (
                                            <div key={category}>
                                                {/* Separator between groups */}
                                                {groupIndex > 0 && (
                                                    <div className="h-px bg-(--cp-border) mx-2 my-1.5" />
                                                )}
                                                
                                                {/* Category heading - normal case like reference */}
                                                {category !== '__top__' && (
                                                    <div className="px-3 py-1 text-xs text-(--cp-muted)">
                                                        {category}
                                                    </div>
                                                )}

                                                {commands.map((cmd) => {
                                                    const currentFlatIndex = getFlatIndex()
                                                    const isSelected = currentFlatIndex === selectedIndex
                                                    // Show keyboard shortcut for first 9 workspace items
                                                    const isWorkspaceItem = cmd.id.startsWith('workspace-')
                                                    const workspaceId = isWorkspaceItem ? cmd.id.replace('workspace-', '') : null
                                                    const workspaceIndex = workspaceId ? (workspaceShortcutIndexById.get(workspaceId) ?? -1) : -1
                                                    const showShortcut = isWorkspaceItem && workspaceIndex >= 0 && workspaceIndex < 9

                                                    if (isWorkspaceItem && workspaceId) {
                                                        return (
                                                            <div
                                                                key={cmd.id}
                                                                className={clsx(
                                                                    "group relative flex items-center w-full px-3 py-1.5 transition-colors",
                                                                    "hover-glow",
                                                                    isSelected ? "bg-(--cp-glow-soft)" : "bg-transparent"
                                                                )}
                                                                onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                                                            >
                                                                <button
                                                                    className="flex-1 flex items-center gap-2 text-left min-w-0 press-effect"
                                                                    onClick={() => executeCommand(cmd)}
                                                                >
                                                                    <span className="text-(--cp-muted) shrink-0">
                                                                        {cmd.icon}
                                                                    </span>
                                                                    <span className="flex-1 text-sm text-(--cp-text) truncate">
                                                                        {cmd.label}
                                                                    </span>
                                                                    {cmd.isActive && (
                                                                        <Check className="h-4 w-4 text-(--cp-muted) shrink-0" />
                                                                    )}
                                                                    {showShortcut && (
                                                                        <span className="kbd ml-2 shrink-0">⌘{workspaceIndex + 1}</span>
                                                                    )}
                                                                </button>
                                                                {!isFixedWorkspace(workspaceId) && (
                                                                <div
                                                                    className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ease-out pointer-events-none group-hover:pointer-events-auto"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        onClick={enterRenameForWorkspace(workspaceId)}
                                                                        className="p-1 rounded text-(--cp-muted) hover:text-(--cp-text) hover:bg-(--cp-glow-soft) transition-colors"
                                                                        title={`Rename ${cmd.label}`}
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={enterDeleteForWorkspace(workspaceId)}
                                                                        className="p-1 rounded text-(--cp-muted) hover:text-(--cp-danger) hover:bg-(--cp-glow-soft) transition-colors"
                                                                        title={`Delete ${cmd.label}`}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                                )}
                                                            </div>
                                                        )
                                                    }

                                                    const showStatusDescription = cmd.id === 'check-for-updates' && updateCheckStatus !== 'idle'

                                                    return (
                                                        <button
                                                            key={cmd.id}
                                                            className={clsx(
                                                                "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                                                "hover-glow press-effect",
                                                                isSelected ? "bg-(--cp-glow-soft)" : "bg-transparent"
                                                            )}
                                                            onClick={() => executeCommand(cmd)}
                                                            onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                                                        >
                                                            <span className="text-(--cp-muted) shrink-0">
                                                                {cmd.icon}
                                                            </span>
                                                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                                                <span className="text-sm text-(--cp-text) truncate">
                                                                    {cmd.label}
                                                                </span>
                                                                {showStatusDescription && cmd.description && (
                                                                    <span className="text-xs text-(--cp-muted) truncate">
                                                                        {cmd.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {cmd.isActive && cmd.id !== 'check-for-updates' && (
                                                                <Check className="h-4 w-4 text-(--cp-muted) shrink-0" />
                                                            )}
                                                            {showShortcut && (
                                                                <span className="kbd ml-2 shrink-0">⌘{workspaceIndex + 1}</span>
                                                            )}
                                                            {cmd.shortcut && (
                                                                <div className="flex items-center gap-1 ml-2 shrink-0">
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
                                    <span className="text-(--cp-muted) shrink-0">
                                        <LayersPlus className="h-5 w-5" />
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
                                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-base text-(--cp-text) placeholder:text-(--cp-muted)"
                                        style={{ fontFamily: currentFontFamily }}
                                    />
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="kbd kbd-input">↵</span>
                                        <span className="kbd kbd-input">esc</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'rename-workspace' && (
                            <div className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-(--cp-muted) shrink-0">
                                        <Pencil className="h-5 w-5" />
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
                                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-base text-(--cp-text) placeholder:text-(--cp-muted)"
                                        style={{ fontFamily: currentFontFamily }}
                                    />
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="kbd kbd-input">↵</span>
                                        <span className="kbd kbd-input">esc</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'confirm-delete' && (
                            <div className="px-3 py-2.5">
                                <div className="flex items-center gap-2 text-(--cp-text)">
                                    <div className="text-sm font-medium truncate">
                                        Delete “{targetWorkspace?.name || 'workspace'}”?
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setTargetWorkspaceIdForAction(null)
                                            setMode('commands')
                                        }}
                                        className="rounded-md border border-(--cp-border-subtle) bg-(--cp-input-bg) px-2.5 py-1 text-xs text-(--cp-text) transition-colors hover:bg-(--cp-input-bg-hover)"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteWorkspace}
                                        className="rounded-md bg-(--cp-danger) px-2.5 py-1 text-xs text-(--cp-danger-text) transition-colors hover:bg-(--cp-danger-hover)"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode === 'font' && (
                            <>
                                <div className="flex items-center justify-between px-3 py-2.5 border-b border-(--cp-border)">
                                    <span className="text-xs text-(--cp-muted)">Font</span>
                                    <button
                                        onClick={() => setMode('commands')}
                                        className="text-xs text-(--cp-muted) hover:text-(--cp-text) transition-colors"
                                    >
                                        esc
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto pt-1.5 pb-2">
                                    {EDITOR_FONTS.map((font, index) => (
                                        <button
                                            key={font.key}
                                            className={clsx(
                                                "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                                                "hover-glow press-effect",
                                                index === selectedIndex ? "bg-(--cp-glow-soft)" : "bg-transparent"
                                            )}
                                            onClick={() => {
                                                onExecuteCommand(`font-${font.key}`)
                                                onClose()
                                            }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            style={{ fontFamily: font.fontFamily }}
                                        >
                                            <span className="text-(--cp-muted) text-sm">Aa</span>
                                            <span className="flex-1 text-sm">{font.name}</span>
                                            {currentEditorFont === font.key && (
                                                <Check className="h-4 w-4 text-(--cp-muted)" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {mode === 'theme' && (
                            <>
                                <div className="flex items-center justify-between px-3 py-2.5 border-b border-(--cp-border)">
                                    <span className="text-xs text-(--cp-muted)">Theme</span>
                                    <button
                                        onClick={() => setMode('commands')}
                                        className="text-xs text-(--cp-muted) hover:text-(--cp-text) transition-colors"
                                    >
                                        esc
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto pt-1.5 pb-2">
                                    {NOTE_STYLES.map((style, index) => (
                                        <button
                                            key={style.key}
                                            className={clsx(
                                                "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                                                "hover-glow press-effect",
                                                index === selectedIndex ? "bg-(--cp-glow-soft)" : "bg-transparent"
                                            )}
                                            onClick={() => {
                                                onExecuteCommand(`style-${style.key}`)
                                                onClose()
                                            }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full border border-(--cp-border-subtle)"
                                                style={{ background: styleSwatches[style.key] || 'var(--cp-bg)' }}
                                            />
                                            <span className="flex-1 text-sm">{style.name}</span>
                                            {currentNoteStyle === style.key && (
                                                <Check className="h-4 w-4 text-(--cp-muted)" />
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
