"use client"

import React, { useState, useCallback } from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { Plus, Split, Trash2 } from "lucide-react"
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import clsx from "clsx"
import { useUiStore, type UiMode } from "../../stores/uiStore"
import { RichTextEditor } from "../notes/RichTextEditor"
import { useThemeStore } from "../../stores/themeStore"

// --- Types ---

type Note = {
  id: string
  content: string
  color: string
}

type PanelId = string

interface BentoWorkspaceProps {
  spaceId: string
}

// Recursive Layout Types
type LayoutType = "container" | "pane"
type LayoutDirection = "horizontal" | "vertical"

interface LayoutNode {
  id: string
  type: LayoutType
  direction?: LayoutDirection // For containers
  children?: LayoutNode[] // For containers
  defaultSize?: number // For initialization
  panelId?: string // For panes
}

// --- Mock Data / Initial State ---

// 4x4 Grid Layout - 4 equal columns, each with 4 equal rows
const INITIAL_LAYOUT: LayoutNode = {
  id: "root",
  type: "container",
  direction: "horizontal",
  children: [
    {
      id: "col-1",
      type: "container",
      direction: "vertical",
      defaultSize: 25,
      children: [
        { id: "pane-1-1", type: "pane", panelId: "p-1-1", defaultSize: 25 },
        { id: "pane-1-2", type: "pane", panelId: "p-1-2", defaultSize: 25 },
        { id: "pane-1-3", type: "pane", panelId: "p-1-3", defaultSize: 25 },
        { id: "pane-1-4", type: "pane", panelId: "p-1-4", defaultSize: 25 },
      ],
    },
    {
      id: "col-2",
      type: "container",
      direction: "vertical",
      defaultSize: 25,
      children: [
        { id: "pane-2-1", type: "pane", panelId: "p-2-1", defaultSize: 25 },
        { id: "pane-2-2", type: "pane", panelId: "p-2-2", defaultSize: 25 },
        { id: "pane-2-3", type: "pane", panelId: "p-2-3", defaultSize: 25 },
        { id: "pane-2-4", type: "pane", panelId: "p-2-4", defaultSize: 25 },
      ],
    },
    {
      id: "col-3",
      type: "container",
      direction: "vertical",
      defaultSize: 25,
      children: [
        { id: "pane-3-1", type: "pane", panelId: "p-3-1", defaultSize: 25 },
        { id: "pane-3-2", type: "pane", panelId: "p-3-2", defaultSize: 25 },
        { id: "pane-3-3", type: "pane", panelId: "p-3-3", defaultSize: 25 },
        { id: "pane-3-4", type: "pane", panelId: "p-3-4", defaultSize: 25 },
      ],
    },
    {
      id: "col-4",
      type: "container",
      direction: "vertical",
      defaultSize: 25,
      children: [
        { id: "pane-4-1", type: "pane", panelId: "p-4-1", defaultSize: 25 },
        { id: "pane-4-2", type: "pane", panelId: "p-4-2", defaultSize: 25 },
        { id: "pane-4-3", type: "pane", panelId: "p-4-3", defaultSize: 25 },
        { id: "pane-4-4", type: "pane", panelId: "p-4-4", defaultSize: 25 },
      ],
    },
  ],
}

// Draggable Note Component - Supports multiple styles (Wabi Grid, Zen Void)
const DraggableNote = ({
  note,
  isOverlay = false,
  onContentChange,
  uiMode = "dashboard",
}: {
  note: Note
  isOverlay?: boolean
  onContentChange?: (content: string) => void
  uiMode?: UiMode
}) => {
  const isDragDisabled = uiMode === "focus"
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note.id,
    data: { note },
    disabled: isDragDisabled,
  })

  // Format date from note ID (which contains timestamp) or use current date
  const noteDate = new Date(parseInt(note.id.split('-')[0]) || Date.now())
  const formattedDate = noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} className="opacity-0 w-full h-full" />
  }

  // Drag handles component (shared between styles)
  const DragHandles = () => (
    !isOverlay && !isDragDisabled ? (
      <div className="absolute inset-0 pointer-events-none z-10">
        <div {...listeners} className="pointer-events-auto absolute inset-x-0 top-0 h-6 cursor-grab active:cursor-grabbing" />
        <div {...listeners} className="pointer-events-auto absolute inset-x-0 bottom-0 h-6 cursor-grab active:cursor-grabbing" />
        <div {...listeners} className="pointer-events-auto absolute inset-y-6 left-0 w-3 cursor-grab active:cursor-grabbing" />
        <div {...listeners} className="pointer-events-auto absolute inset-y-6 right-0 w-3 cursor-grab active:cursor-grabbing" />
      </div>
    ) : null
  )

  // =============== ZEN VOID STYLE ===============
  if (currentNoteStyle === 'zen-void') {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        className={clsx(
          "group relative w-full h-full transition-all duration-500",
          "flex flex-col overflow-hidden",
          "bg-[var(--void-bg)]",
          isOverlay && "shadow-2xl scale-105 z-50",
        )}
      >
        <DragHandles />

        {/* Header - Title and Date on same line (matching Wabi Grid layout) */}
        <div className="flex justify-between items-center px-3 pt-3 pb-2">
          <h3
            className="text-[16px] tracking-wide text-[var(--void-title)] transition-colors duration-300"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
          >
            Untitled
          </h3>
          <span
            className="text-[9px] text-[var(--void-date)] uppercase tracking-wider transition-colors duration-300"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {formattedDate}
          </span>
        </div>

        {/* Content Area - Same padding as Wabi Grid */}
        <div className="flex-1 flex flex-col pl-3 pb-3 pr-1 min-h-0">
          {/* Editor Area */}
          <div
            className="flex-1 min-h-0 zen-void-editor"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <RichTextEditor noteId={note.id} content={note.content} onContentChange={onContentChange} />
          </div>
        </div>
      </div>
    )
  }

  // =============== WABI GRID STYLE (Default) ===============
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={clsx(
        "group relative w-full h-full transition-all duration-300",
        "flex flex-col overflow-hidden",
        "bg-[var(--wabi-bg)]",
        isOverlay && "shadow-2xl scale-105 z-50 ring-1 ring-white/20",
      )}
    >
      <DragHandles />

      {/* Header - Title and Date on same line */}
      <div className="flex justify-between items-center px-3 pt-3 pb-2">
        <h3
          className="text-[12px] tracking-[0.2em] uppercase text-[var(--wabi-title)] transition-colors duration-300"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
        >
          UNTITLED NOTE
        </h3>
        <span
          className="text-[9px] text-[var(--wabi-date)] transition-colors duration-300"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {formattedDate}
        </span>
      </div>

      {/* Content Area - Less right padding so scrollbar is closer to border */}
      <div className="flex-1 flex flex-col pl-3 pb-3 pr-1 min-h-0">
        {/* Editor Area - Serif Italic Style */}
        <div
          className="flex-1 min-h-0 wabi-grid-editor"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <RichTextEditor noteId={note.id} content={note.content} onContentChange={onContentChange} />
        </div>
      </div>
    </div>
  )
}

// Droppable Panel Component
const PanelContent = ({
  panelId,
  notes,
  onSplit,
  onRemove,
  uiMode,
  onNoteContentChange,
}: {
  panelId: string
  notes: Note[]
  onSplit: (direction: "horizontal" | "vertical") => void
  onRemove: () => void
  uiMode: UiMode
  onNoteContentChange?: (noteId: string, content: string) => void
}) => {
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)
  const { setNodeRef, isOver } = useDroppable({
    id: panelId,
  })

  const hasNote = notes.length > 0

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "relative w-full h-full group transition-all duration-200",
        "bg-transparent",
        // Style-specific border and radius
        currentNoteStyle === 'zen-void'
          ? "border border-[var(--void-border)] hover:border-[var(--void-border-hover)]"
          : "border border-[var(--wabi-border)] hover:border-[var(--wabi-border-hover)] rounded-xs",
      )}
      style={
        uiMode === "dashboard"
          ? {
            background: isOver
              ? "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.04) 50%, transparent 80%)"
              : undefined,
          }
          : undefined
      }
    >
      {/* Hover gradient overlay for dashboard mode (only visible when not isOver, since isOver has its own) */}
      {uiMode === "dashboard" && !isOver && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.08) 0%, rgba(168, 85, 247, 0.03) 50%, transparent 80%)",
          }}
        />
      )}
      {/* Panel Controls (Visible on Hover in dashboard mode only) */}
      {uiMode === "dashboard" && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={() => onSplit("vertical")}
            className="p-1 rounded bg-[var(--surface-bg)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors"
            title="Split Vertically"
          >
            <Split className="w-3 h-3 rotate-90" />
          </button>
          <button
            onClick={() => onSplit("horizontal")}
            className="p-1 rounded bg-[var(--surface-bg)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] transition-colors"
            title="Split Horizontally"
          >
            <Split className="w-3 h-3" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded bg-black/50 text-white/50 hover:text-red-400 hover:bg-black/80 transition-colors"
            title="Remove Panel"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="w-full h-full p-1 relative z-0">
        {hasNote ? (
          <DraggableNote
            note={notes[0]}
            uiMode={uiMode}
            onContentChange={(content) => onNoteContentChange?.(notes[0].id, content)}
          />
        ) : uiMode === "dashboard" ? (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]/60 text-xs pointer-events-none">
            Drop note here
          </div>
        ) : null}
      </div>
    </div>
  )
}

// Recursive Layout Renderer
const LayoutRenderer = ({
  node,
  panelNotes,
  onSplit,
  onRemove,
  uiMode,
  isDragging,
  onNoteContentChange,
}: {
  node: LayoutNode
  panelNotes: Record<string, Note[]>
  onSplit: (panelId: string, direction: "horizontal" | "vertical") => void
  onRemove: (panelId: string) => void
  uiMode: UiMode
  isDragging: boolean
  onNoteContentChange?: (noteId: string, content: string) => void
}) => {
  if (node.type === "pane") {
    return (
      <PanelContent
        panelId={node.panelId!}
        notes={panelNotes[node.panelId!] || []}
        onSplit={(dir) => onSplit(node.id, dir)}
        onRemove={() => onRemove(node.id)}
        uiMode={uiMode}
        onNoteContentChange={onNoteContentChange}
      />
    )
  }

  return (
    <PanelGroup direction={node.direction || "horizontal"} className="w-full h-full">
      {node.children?.map((child, index) => (
        <React.Fragment key={child.id}>
          <Panel id={child.id} order={index} defaultSize={child.defaultSize} minSize={4}>
            <LayoutRenderer
              node={child}
              panelNotes={panelNotes}
              onSplit={onSplit}
              onRemove={onRemove}
              uiMode={uiMode}
              isDragging={isDragging}
              onNoteContentChange={onNoteContentChange}
            />
          </Panel>
          {index < (node.children?.length || 0) - 1 && (
            <PanelResizeHandle
              className={clsx(
                "transition-colors z-50 bg-transparent",
                node.direction === "horizontal" ? "w-[6px]" : "h-[6px]",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </PanelGroup>
  )
}

// Helper to update tree
const splitNodeInTree = (root: LayoutNode, targetId: string, splitDirection: "horizontal" | "vertical"): LayoutNode => {
  if (root.id === targetId) {
    // We found the node to split.
    // If it's a pane, we replace it with a container containing two panes.
    if (root.type === "pane") {
      const parentDefaultSize = root.defaultSize ?? 50
      return {
        id: `group-${Date.now()}`,
        type: "container",
        defaultSize: parentDefaultSize, // Preserve the space the original pane was occupying
        direction: splitDirection === "vertical" ? "vertical" : "horizontal", // In ResizablePanels, vertical direction means items stacked vertically (rows)
        children: [
          { ...root, defaultSize: 50 },
          {
            id: `pane-${Date.now()}`,
            type: "pane",
            panelId: `p-${Date.now()}`,
            defaultSize: 50,
          },
        ],
      }
    }
  }

  if (root.children) {
    return {
      ...root,
      children: root.children.map((child) => splitNodeInTree(child, targetId, splitDirection)),
    }
  }

  return root
}

const removeNodeFromTree = (root: LayoutNode, targetId: string): LayoutNode | null => {
  if (root.id === targetId) return null

  if (root.children) {
    const newChildren = root.children
      .map((child) => removeNodeFromTree(child, targetId))
      .filter((child): child is LayoutNode => child !== null)

    // If a container has no children, remove it too
    if (newChildren.length === 0) return null

    // If a container has 1 child, collapse it (optional optimization, keeps tree clean)
    // For simplicity, we'll just keep the container for now or lift the child.
    // Let's just return the container with fewer children.

    // Recalculate sizes? Resizable panels handles percentages, but if we remove one, others should grow.
    // Ideally we re-normalize defaultSize. dnd-kit/resizable-panels might handle this automatically if we don't provide explicit sizes on re-render or if layout prop changes.
    // We'll leave size mgmt to the library for this prototype.

    return {
      ...root,
      children: newChildren,
    }
  }

  return root
}

// --- Main Component ---

export const BentoWorkspace = ({ spaceId: _spaceId }: BentoWorkspaceProps) => {
  const [layout, setLayout] = useState<LayoutNode>(INITIAL_LAYOUT)
  const [panelNotes, setPanelNotes] = useState<Record<PanelId, Note[]>>({})
  const [draggedNote, setDraggedNote] = useState<Note | null>(null)
  const uiMode = useUiStore((state) => state.uiMode)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const themeTokens = useThemeStore((state) => state.getCurrentThemeTokens())

  // --- Color Definitions for Sticky Notes ---
  // Solid colors + texture patterns on dark base
  const COLORS = [
    // Solid Colors
    { name: "Black", value: "bg-black", hex: "#000000", type: "solid" },
    { name: "Charcoal", value: "bg-neutral-800", hex: "#262626", type: "solid" },
    { name: "Stone", value: "bg-neutral-700", hex: "#404040", type: "solid" },
    { name: "Blue", value: "bg-blue-600", hex: "#2563eb", type: "solid" },
    { name: "Violet", value: "bg-violet-600", hex: "#7c3aed", type: "solid" },
    { name: "Forest", value: "bg-emerald-900", hex: "#064e3b", type: "solid" },
    // Texture Patterns (on dark base)
    { name: "Stars", value: "note-pattern-noise", hex: "#0a0a0a", type: "pattern" },
    { name: "Cross", value: "note-pattern-dots", hex: "#0a0a0a", type: "pattern" },
    { name: "Grid", value: "note-pattern-grid", hex: "#0a0a0a", type: "pattern" },
    { name: "Lines", value: "note-pattern-lines", hex: "#0a0a0a", type: "pattern" },
  ]

  // -- Actions --

  const createNote = (color: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: "",
      color: color,
    }

    // Find first empty panel or use the first panel
    const firstPanelId = "p-1-1"
    setPanelNotes((prev) => ({
      ...prev,
      [firstPanelId]: [...(prev[firstPanelId] || []), newNote],
    }))

    // Close the color picker after creating a note
    setIsColorPickerOpen(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setDraggedNote(active.data.current?.note as Note)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedNote(null)

    if (!over) return

    const note = active.data.current?.note as Note
    const targetPanelId = over.id as string

    // Remove from old panel
    const newPanelNotes = { ...panelNotes }
    Object.keys(newPanelNotes).forEach((key) => {
      newPanelNotes[key] = newPanelNotes[key].filter((n) => n.id !== note.id)
    })

    // Add to new panel (replace existing if any? Bento usually 1 item per cell)
    // User said: "It's actually doing a mistake when I click on a note and it adds a sort of note to the focus panel... It should occupy the entire panel"
    // So assume 1 note per panel for this layout.

    // If target has a note, maybe swap? Or just overwrite?
    // Let's overwrite/stack for now.
    newPanelNotes[targetPanelId] = [note] // Force single note

    setPanelNotes(newPanelNotes)
  }

  const handleNoteContentChange = useCallback((noteId: string, content: string) => {
    setPanelNotes((prev) => {
      const newPanelNotes = { ...prev }
      Object.keys(newPanelNotes).forEach((panelId) => {
        const noteIndex = newPanelNotes[panelId].findIndex((n) => n.id === noteId)
        if (noteIndex !== -1) {
          newPanelNotes[panelId] = newPanelNotes[panelId].map((n) => (n.id === noteId ? { ...n, content } : n))
        }
      })
      return newPanelNotes
    })
  }, [])

  const onSplit = useCallback((nodeId: string, direction: "horizontal" | "vertical") => {
    setLayout((prev) => splitNodeInTree(prev, nodeId, direction))
  }, [])

  const onRemove = useCallback((nodeId: string) => {
    setLayout((prev) => {
      const newLayout = removeNodeFromTree(prev, nodeId)
      return newLayout || prev // Prevent removing root if it results in null
    })
  }, [])

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full w-full bg-[var(--app-bg)] text-[var(--text-primary)] overflow-hidden flex flex-col font-sans">
        {/* Workspace Area */}
        <div className={"flex-1 overflow-hidden relative p-2"}>
          <LayoutRenderer
            node={layout}
            panelNotes={panelNotes}
            onSplit={onSplit}
            onRemove={onRemove}
            uiMode={uiMode}
            isDragging={!!draggedNote}
            onNoteContentChange={handleNoteContentChange}
          />
        </div>

        {/* Floating Controls (visible in dashboard mode only) */}
        {uiMode === "dashboard" && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div
              className="relative flex items-center rounded-full border border-white/10 shadow-2xl overflow-visible"
              style={{ backgroundColor: themeTokens.appBg }}
            >
              {/* Main trigger button */}
              <button
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="relative z-50 p-2.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                style={{ backgroundColor: themeTokens.appBg }}
              >
                <Plus className={`w-5 h-5 transition-transform duration-300 ${isColorPickerOpen ? "rotate-45" : ""}`} />
              </button>

              {/* Color buttons container - horizontal expansion */}
              <div className="relative flex items-center h-5">
                {COLORS.map((color, index) => (
                  <button
                    key={color.name}
                    onClick={() => createNote(color.value)}
                    className={clsx(
                      "absolute rounded-full border border-white/30 will-change-transform hover:z-50 hover:border-white/50",
                      color.type === "pattern" && color.value
                    )}
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: color.hex,
                      transform: `translateX(${isColorPickerOpen ? index * 24 + 4 : 0}px) scale(${isColorPickerOpen ? 1 : 0.5})`,
                      opacity: isColorPickerOpen ? 1 : 0,
                      pointerEvents: isColorPickerOpen ? "auto" : "none",
                      transition: `transform ${isColorPickerOpen ? "300ms" : "200ms"} cubic-bezier(0.4, 0, 0.2, 1) ${isColorPickerOpen ? index * 40 : (COLORS.length - index) * 20}ms,
                                   opacity ${isColorPickerOpen ? "200ms" : "150ms"} ease ${isColorPickerOpen ? index * 40 : 0}ms`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                    title={color.name}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = `translateX(${index * 24 + 4}px) scale(1.15)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = `translateX(${isColorPickerOpen ? index * 24 + 4 : 0}px) scale(${isColorPickerOpen ? 1 : 0.5})`
                    }}
                  />
                ))}
              </div>

              {/* Spacer to prevent layout jump when expanded */}
              <div
                className="transition-all duration-300 ease-out"
                style={{
                  width: isColorPickerOpen ? `${COLORS.length * 24 + 8}px` : "0px",
                }}
              />
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>{draggedNote ? <DraggableNote note={draggedNote} isOverlay /> : null}</DragOverlay>
      </div>
    </DndContext>
  )
}
