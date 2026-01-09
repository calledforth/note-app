"use client"

import React, { useState, useCallback, useMemo } from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { Split, Trash2 } from "lucide-react"
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import clsx from "clsx"
import { RichTextEditor } from "../notes/RichTextEditor"
import { useThemeStore } from "../../stores/themeStore"
import { useBentoStore } from "../../stores/bentoStore"
import type { LayoutNode, BentoNote } from "../../types/bento"

// ============================================================================
// DRAGGABLE NOTE COMPONENT
// - Supports Wabi Grid and Zen Void styles
// - No title, minimal header with action buttons on hover
// - Drag only from header area
// ============================================================================

const DraggableNote = ({
  note,
  isOverlay = false,
  onContentChange,
  onSplit,
  onRemove,
}: {
  note: BentoNote
  isOverlay?: boolean
  onContentChange?: (content: string) => void
  onSplit?: (direction: "horizontal" | "vertical") => void
  onRemove?: () => void
}) => {
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note.id,
    data: { note },
    disabled: false,
  })

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} className="opacity-0 w-full h-full" />
  }

  // Panel control buttons - shown on header hover
  const PanelControls = () => (
    !isOverlay && onSplit && onRemove ? (
      <div className={clsx(
        "flex items-center gap-1 transition-opacity duration-150",
        isHeaderHovered ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <button
          onClick={(e) => { e.stopPropagation(); onSplit("vertical"); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={clsx(
            "p-1 rounded transition-all duration-150",
            currentNoteStyle === 'zen-void'
              ? "text-white/40 hover:text-white/70 hover:bg-white/10"
              : "text-[#555] hover:text-[#888] hover:bg-white/10"
          )}
          title="Split Vertically"
        >
          <Split className="w-3 h-3 rotate-90" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSplit("horizontal"); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={clsx(
            "p-1 rounded transition-all duration-150",
            currentNoteStyle === 'zen-void'
              ? "text-white/40 hover:text-white/70 hover:bg-white/10"
              : "text-[#555] hover:text-[#888] hover:bg-white/10"
          )}
          title="Split Horizontally"
        >
          <Split className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={clsx(
            "p-1 rounded transition-all duration-150",
            currentNoteStyle === 'zen-void'
              ? "text-white/40 hover:text-red-400/70 hover:bg-white/10"
              : "text-[#555] hover:text-red-400 hover:bg-white/10"
          )}
          title="Remove Panel"
        >
          <Trash2 className="w-3 h-3" />
        </button>
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
          isOverlay && "shadow-2xl z-50",
        )}
      >
        {/* Draggable Header - minimal, no title */}
        <div
          {...(isOverlay ? {} : listeners)}
          className={clsx(
            "flex justify-end items-center relative z-20",
            !isOverlay && "cursor-grab active:cursor-grabbing"
          )}
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
        >
          <PanelControls />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col pl-3 pb-3 pr-1 min-h-0">
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
        isOverlay && "shadow-2xl z-50 ring-1 ring-white/20",
      )}
    >
      {/* Draggable Header - minimal, no title */}
      <div
        {...(isOverlay ? {} : listeners)}
        className={clsx(
          "flex justify-end items-center relative z-20",
          !isOverlay && "cursor-grab active:cursor-grabbing"
        )}
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
      >
        <PanelControls />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col pl-3 pb-3 pr-1 min-h-0">
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

// ============================================================================
// DROPPABLE PANEL COMPONENT
// ============================================================================

const PanelContent = ({
  panelId,
  note,
  onSplit,
  onRemove,
  onNoteContentChange,
}: {
  panelId: string
  note: BentoNote | null
  onSplit: (direction: "horizontal" | "vertical") => void
  onRemove: () => void
  onNoteContentChange?: (noteId: string, content: string) => void
}) => {
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)
  const [isPanelHovered, setIsPanelHovered] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: panelId,
  })

  // Panel controls for empty panels - shown on hover
  const EmptyPanelControls = () => (
    isPanelHovered ? (
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onSplit("vertical"); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={clsx(
            "p-1 rounded transition-all duration-150",
            currentNoteStyle === 'zen-void'
              ? "text-white/40 hover:text-white/70 hover:bg-white/10"
              : "text-[#555] hover:text-[#888] hover:bg-white/10"
          )}
          title="Split Vertically"
        >
          <Split className="w-3 h-3 rotate-90" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSplit("horizontal"); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={clsx(
            "p-1 rounded transition-all duration-150",
            currentNoteStyle === 'zen-void'
              ? "text-white/40 hover:text-white/70 hover:bg-white/10"
              : "text-[#555] hover:text-[#888] hover:bg-white/10"
          )}
          title="Split Horizontally"
        >
          <Split className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={clsx(
            "p-1 rounded transition-all duration-150",
            currentNoteStyle === 'zen-void'
              ? "text-white/40 hover:text-red-400/70 hover:bg-white/10"
              : "text-[#555] hover:text-red-400 hover:bg-white/10"
          )}
          title="Remove Panel"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    ) : null
  )

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "relative w-full h-full group transition-all duration-200",
        "bg-transparent",
        currentNoteStyle === 'zen-void'
          ? "border border-[var(--void-border)] hover:border-[var(--void-border-hover)]"
          : "border border-[var(--wabi-border)] hover:border-[var(--wabi-border-hover)] rounded-xs",
        // Enhanced drop zone feedback - more prominent glow
        isOver && (currentNoteStyle === 'zen-void'
          ? "border-white/40 bg-white/8 ring-2 ring-white/20 ring-inset"
          : "border-[var(--wabi-border-hover)] bg-[#1a1915] ring-2 ring-[var(--wabi-border-hover)]/40 ring-inset"
        )
      )}
      style={isOver ? {
        boxShadow: currentNoteStyle === 'zen-void'
          ? 'inset 0 0 30px rgba(255, 255, 255, 0.08)'
          : 'inset 0 0 30px rgba(196, 181, 140, 0.1)'
      } : undefined}
      onMouseEnter={() => setIsPanelHovered(true)}
      onMouseLeave={() => setIsPanelHovered(false)}
    >
      {/* Content Area */}
      <div className="w-full h-full p-1 relative z-0">
        {note ? (
          <DraggableNote
            note={note}
            onContentChange={(content) => onNoteContentChange?.(note.id, content)}
            onSplit={onSplit}
            onRemove={onRemove}
          />
        ) : (
          <>
            <EmptyPanelControls />
            <div className={clsx(
              "w-full h-full flex items-center justify-center text-xs pointer-events-none",
              isOver
                ? (currentNoteStyle === 'zen-void' ? "text-white/50" : "text-[var(--text-secondary)]/60")
                : "text-[var(--text-secondary)]/40"
            )}>
              {isOver ? "Release to drop" : "Drop note here"}
            </div>
          </>
        )}
      </div>
    </div>
  )
}


// ============================================================================
// LAYOUT RENDERER
// ============================================================================

const LayoutRenderer = ({
  node,
  notesByPanel,
  onSplit,
  onRemove,
  isDragging,
  onNoteContentChange,
}: {
  node: LayoutNode
  notesByPanel: Record<string, BentoNote>
  onSplit: (panelId: string, direction: "horizontal" | "vertical") => void
  onRemove: (panelId: string) => void
  isDragging: boolean
  onNoteContentChange?: (noteId: string, content: string) => void
}) => {
  if (node.type === "pane") {
    const note = node.panelId ? notesByPanel[node.panelId] : null
    return (
      <PanelContent
        panelId={node.panelId!}
        note={note || null}
        onSplit={(dir) => onSplit(node.id, dir)}
        onRemove={() => onRemove(node.id)}
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
              notesByPanel={notesByPanel}
              onSplit={onSplit}
              onRemove={onRemove}
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

// ============================================================================
// TREE MANIPULATION HELPERS
// ============================================================================

const splitNodeInTree = (root: LayoutNode, targetId: string, splitDirection: "horizontal" | "vertical"): LayoutNode => {
  if (root.id === targetId) {
    if (root.type === "pane") {
      const parentDefaultSize = root.defaultSize ?? 50
      return {
        id: `group-${Date.now()}`,
        type: "container",
        defaultSize: parentDefaultSize,
        direction: splitDirection === "vertical" ? "vertical" : "horizontal",
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

    if (newChildren.length === 0) return null

    return {
      ...root,
      children: newChildren,
    }
  }

  return root
}

// ============================================================================
// MAIN BENTO WORKSPACE COMPONENT
// ============================================================================

interface BentoWorkspaceProps {
  spaceId: string
}

export const BentoWorkspace = ({ spaceId: _spaceId }: BentoWorkspaceProps) => {
  const [draggedNote, setDraggedNote] = useState<BentoNote | null>(null)

  // Get data from store
  const notes = useBentoStore((state) => state.notes)
  const currentWorkspace = useBentoStore((state) => state.currentWorkspace())
  const updateWorkspaceLayout = useBentoStore((state) => state.updateWorkspaceLayout)
  const updateNoteContent = useBentoStore((state) => state.updateNoteContent)
  const updateNotePanelId = useBentoStore((state) => state.updateNotePanelId)
  const deleteNote = useBentoStore((state) => state.deleteNote)

  // Get layout from current workspace
  const layout = currentWorkspace?.layout

  // Create notesByPanel lookup for O(1) access
  const notesByPanel = useMemo(() => {
    const map: Record<string, BentoNote> = {}
    for (const note of notes) {
      if (note.panelId) {
        map[note.panelId] = note
      }
    }
    return map
  }, [notes])

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setDraggedNote(active.data.current?.note as BentoNote)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedNote(null)

    if (!over) return

    const note = active.data.current?.note as BentoNote
    const targetPanelId = over.id as string

    // If the target panel already has a note, don't swap (for now)
    if (notesByPanel[targetPanelId] && notesByPanel[targetPanelId].id !== note.id) {
      return
    }

    // Update note's panelId
    updateNotePanelId(note.id, targetPanelId)
  }

  // Content change handler
  const handleNoteContentChange = useCallback((noteId: string, content: string) => {
    updateNoteContent(noteId, content)
  }, [updateNoteContent])

  // Layout manipulation
  const onSplit = useCallback((nodeId: string, direction: "horizontal" | "vertical") => {
    if (!currentWorkspace || !layout) return
    const newLayout = splitNodeInTree(layout, nodeId, direction)
    updateWorkspaceLayout(currentWorkspace.id, newLayout)
  }, [currentWorkspace, layout, updateWorkspaceLayout])

  const onRemove = useCallback((nodeId: string) => {
    if (!currentWorkspace || !layout) return
    const newLayout = removeNodeFromTree(layout, nodeId)
    if (newLayout) {
      updateWorkspaceLayout(currentWorkspace.id, newLayout)
    }
  }, [currentWorkspace, layout, updateWorkspaceLayout])

  // Handle note deletion (also removes from panel)
  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote(noteId)
  }, [deleteNote])

  if (!layout) {
    return (
      <div className="h-full w-full flex items-center justify-center text-[var(--text-secondary)]">
        Loading workspace...
      </div>
    )
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full w-full bg-[var(--app-bg)] text-[var(--text-primary)] overflow-hidden flex flex-col font-sans">
        {/* Workspace Area */}
        <div className="flex-1 overflow-hidden relative p-2">
          <LayoutRenderer
            node={layout}
            notesByPanel={notesByPanel}
            onSplit={onSplit}
            onRemove={(nodeId) => {
              // Find and delete any note in this panel before removing it
              const paneNode = findPaneById(layout, nodeId)
              if (paneNode?.panelId && notesByPanel[paneNode.panelId]) {
                handleDeleteNote(notesByPanel[paneNode.panelId].id)
              }
              onRemove(nodeId)
            }}
            isDragging={!!draggedNote}
            onNoteContentChange={handleNoteContentChange}
          />
        </div>

        {/* Drag Overlay - dropAnimation null prevents snap-back animation */}
        <DragOverlay dropAnimation={null}>{draggedNote ? <DraggableNote note={draggedNote} isOverlay /> : null}</DragOverlay>
      </div>
    </DndContext>
  )
}

// Helper to find a pane by node ID
function findPaneById(node: LayoutNode, id: string): LayoutNode | null {
  if (node.id === id) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findPaneById(child, id)
      if (found) return found
    }
  }
  return null
}
