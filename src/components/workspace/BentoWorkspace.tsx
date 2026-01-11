import React, { useState, useCallback, useMemo } from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { Split, Trash2, MoreHorizontal, Square, SquareDashed } from "lucide-react"
import { DndContext, DragOverlay, useDraggable, useDroppable, defaultDropAnimationSideEffects } from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent, DropAnimation } from "@dnd-kit/core"
import clsx from "clsx"
import { RichTextEditor } from "../notes/RichTextEditor"
import { useThemeStore } from "../../stores/themeStore"
import { useBentoStore } from "../../stores/bentoStore"
import type { LayoutNode, BentoNote } from "../../types/bento"
import { computeBorderVisibility } from "../../types/bento"

// ============================================================================
// DRAGGABLE NOTE COMPONENT
// - Supports Wabi Grid and Zen Void styles
// - Persistent "..." menu that expands to show controls
// - Drag only from header area
// ============================================================================

const DraggableNote = ({
  note,
  isOverlay = false,
  showBorder = true,
  onContentChange,
  onSplit,
  onRemove,
  onToggleBorder,
}: {
  note: BentoNote
  isOverlay?: boolean
  showBorder?: boolean
  onContentChange?: (content: string) => void
  onSplit?: (direction: "horizontal" | "vertical") => void
  onRemove?: () => void
  onToggleBorder?: () => void
}) => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note.id,
    data: { note },
    disabled: false,
  })

  // Get container padding - minimal and uniform for all panels
  // Note: Horizontal content padding is handled via CSS (clamp-based responsive padding in .ql-editor)
  const getContentPadding = () => {
    // Uniform minimal container padding - no special treatment for borderless panels
    return "pl-3 pb-3 pr-1"
  }

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} className="opacity-0 w-full h-full" />
  }

  // Panel control buttons - expandable "..." menu
  // The "..." button is always visible, expanded controls appear on click
  // When isOverlay (drag preview), render empty spacer to maintain header height
  const PanelControls = () => {
    // For overlay, render spacer to maintain consistent header height
    if (isOverlay) {
      return <div className="h-7" /> // Match the height of the controls area
    }

    if (!onSplit || !onRemove) {
      return null
    }

    return (
      <div
        className="flex items-center gap-0.5 pt-2 pr-2"
        onMouseLeave={() => setIsMenuExpanded(false)}
      >
        {/* Expanded controls - shown when menu is expanded */}
        <div className={clsx(
          "flex items-center gap-0.5 overflow-hidden transition-all duration-200",
          isMenuExpanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
        )}>
          {/* Border toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBorder?.(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className={clsx(
              "p-1 rounded transition-all duration-150 hover:bg-white/10",
              showBorder ? "text-white/60 hover:text-white/90" : "text-amber-400/80 hover:text-amber-400"
            )}
            title={showBorder ? "Hide Border" : "Show Border"}
          >
            {showBorder ? <Square className="w-3 h-3" /> : <SquareDashed className="w-3 h-3" />}
          </button>
          {/* Split vertically */}
          <button
            onClick={(e) => { e.stopPropagation(); onSplit("vertical"); setIsMenuExpanded(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded transition-all duration-150 text-white/60 hover:text-white/90 hover:bg-white/10"
            title="Split Vertically"
          >
            <Split className="w-3 h-3 rotate-90" />
          </button>
          {/* Split horizontally */}
          <button
            onClick={(e) => { e.stopPropagation(); onSplit("horizontal"); setIsMenuExpanded(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded transition-all duration-150 text-white/60 hover:text-white/90 hover:bg-white/10"
            title="Split Horizontally"
          >
            <Split className="w-3 h-3" />
          </button>
          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded transition-all duration-150 text-white/60 hover:text-red-400 hover:bg-white/10"
            title="Remove Panel"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Menu trigger - ALWAYS visible (not hidden on non-hover) */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsMenuExpanded(!isMenuExpanded); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={clsx(
            "p-1 rounded transition-all duration-150 hover:bg-white/10",
            isMenuExpanded ? "text-white/90 bg-white/10" : "text-white/30 hover:text-white/60"
          )}
          title="Panel Options"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

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
        >
          <PanelControls />
        </div>

        {/* Content Area */}
        <div className={clsx("flex-1 flex flex-col min-h-0", getContentPadding())}>
          <div
            className="flex-1 min-h-0 zen-void-editor"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <RichTextEditor noteId={note.id} content={note.content} onContentChange={onContentChange} />
          </div>
        </div>
      </div>
    )
  }

  // =============== TEST LAB STYLE (Experimental) ===============
  if (currentNoteStyle === 'test-lab') {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        className={clsx(
          "group relative w-full h-full transition-all duration-300",
          "flex flex-col overflow-hidden rounded-md",
          "bg-[var(--lab-bg)]",
          isOverlay && "shadow-2xl z-50 ring-1 ring-[var(--lab-accent)]/30",
        )}
      >
        {/* Draggable Header - minimal, no title */}
        <div
          {...(isOverlay ? {} : listeners)}
          className={clsx(
            "flex justify-end items-center relative z-20",
            !isOverlay && "cursor-grab active:cursor-grabbing"
          )}
        >
          <PanelControls />
        </div>

        {/* Content Area */}
        <div className={clsx("flex-1 flex flex-col min-h-0", getContentPadding())}>
          <div
            className="flex-1 min-h-0 test-lab-editor"
            onPointerDown={(e) => e.stopPropagation()}
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
      >
        <PanelControls />
      </div>

      {/* Content Area */}
      <div className={clsx("flex-1 flex flex-col min-h-0", getContentPadding())}>
        <div
          className="flex-1 min-h-0 wabi-grid-editor"
          onPointerDown={(e) => e.stopPropagation()}
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
  showBorder,
  onSplit,
  onRemove,
  onNoteContentChange,
  onToggleBorder,
}: {
  panelId: string
  note: BentoNote | null
  showBorder: boolean
  onSplit: (direction: "horizontal" | "vertical") => void
  onRemove: () => void
  onNoteContentChange?: (noteId: string, content: string) => void
  onToggleBorder?: () => void
}) => {
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)
  const [isPanelHovered, setIsPanelHovered] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: panelId,
  })

  // Panel controls for empty panels - shown on hover
  const EmptyPanelControls = () => (
    isPanelHovered ? (
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onSplit("vertical"); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded transition-all duration-150 text-white/60 hover:text-white/90 hover:bg-white/10"
          title="Split Vertically"
        >
          <Split className="w-3 h-3 rotate-90" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSplit("horizontal"); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded transition-all duration-150 text-white/60 hover:text-white/90 hover:bg-white/10"
          title="Split Horizontally"
        >
          <Split className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded transition-all duration-150 text-white/60 hover:text-red-400 hover:bg-white/10"
          title="Remove Panel"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    ) : null
  )

  // Get border classes based on theme and showBorder flag
  const getBorderClasses = () => {
    // Borderless panels blend into the background
    if (!showBorder) {
      return "border border-transparent"
    }
    // Bordered panels (sharing space with siblings)
    if (currentNoteStyle === 'zen-void') {
      return "border border-[var(--void-border)] hover:border-[var(--void-border-hover)]"
    }
    if (currentNoteStyle === 'test-lab') {
      return "border border-[var(--lab-border)] hover:border-[var(--lab-border-hover)] rounded-md"
    }
    return "border border-[var(--wabi-border)] hover:border-[var(--wabi-border-hover)] rounded-xs"
  }

  // Get drop zone classes based on theme - dotted border + bright glow when dragging over
  const getDropZoneClasses = () => {
    if (!isOver) return ""
    // Common: dotted border + bright highlight
    if (currentNoteStyle === 'zen-void') {
      return "!border-dashed !border-white/60 bg-white/10 ring-2 ring-white/30 ring-inset"
    }
    if (currentNoteStyle === 'test-lab') {
      return "!border-dashed !border-white/50 bg-white/8 ring-2 ring-white/25 ring-inset"
    }
    // Wabi Grid
    return "!border-dashed !border-white/50 bg-white/8 ring-2 ring-white/25 ring-inset"
  }

  // Get drop zone shadow based on theme - brighter glow
  const getDropZoneShadow = () => {
    if (!isOver) return undefined
    if (currentNoteStyle === 'zen-void') {
      return { boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.15)' }
    }
    if (currentNoteStyle === 'test-lab') {
      return { boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.12)' }
    }
    return { boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.12)' }
  }

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "relative w-full h-full group bg-transparent transition-all duration-150",
        getBorderClasses(),
        getDropZoneClasses()
      )}
      style={getDropZoneShadow()}
      onMouseEnter={() => setIsPanelHovered(true)}
      onMouseLeave={() => setIsPanelHovered(false)}
    >
      {/* Content Area */}
      <div className="w-full h-full relative z-0">
        {note ? (
          <div key={`${note.id}-${panelId}`} className="w-full h-full note-swap-animation">
            <DraggableNote
              note={note}
              showBorder={showBorder}
              onContentChange={(content) => onNoteContentChange?.(note.id, content)}
              onSplit={onSplit}
              onRemove={onRemove}
              onToggleBorder={onToggleBorder}
            />
          </div>
        ) : (
          <>
            <EmptyPanelControls />
            {/* Only show drop hint for bordered panels, keep borderless clean */}
            {showBorder && (
              <div className={clsx(
                "w-full h-full flex items-center justify-center text-xs pointer-events-none",
                isOver
                  ? (currentNoteStyle === 'zen-void' ? "text-white/50" : "text-[var(--text-secondary)]/60")
                  : "text-[var(--text-secondary)]/40"
              )}>
                {isOver ? "Release to drop" : "Drop note here"}
              </div>
            )}
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
  borderVisibilityMap,
  onSplit,
  onRemove,
  isDragging,
  onNoteContentChange,
  onToggleBorder,
}: {
  node: LayoutNode
  notesByPanel: Record<string, BentoNote>
  borderVisibilityMap: Set<string>
  onSplit: (panelId: string, direction: "horizontal" | "vertical") => void
  onRemove: (panelId: string) => void
  isDragging: boolean
  onNoteContentChange?: (noteId: string, content: string) => void
  onToggleBorder?: (noteId: string) => void
}) => {
  if (node.type === "pane") {
    const note = node.panelId ? notesByPanel[node.panelId] : null
    // Compute effective showBorder: default behavior, unless user has overridden with borderHidden
    const defaultShowBorder = node.panelId ? borderVisibilityMap.has(node.panelId) : false
    const showBorder = note?.borderHidden ? false : defaultShowBorder
    return (
      <PanelContent
        panelId={node.panelId!}
        note={note || null}
        showBorder={showBorder}
        onSplit={(dir) => onSplit(node.id, dir)}
        onRemove={() => onRemove(node.id)}
        onNoteContentChange={onNoteContentChange}
        onToggleBorder={note ? () => onToggleBorder?.(note.id) : undefined}
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
              borderVisibilityMap={borderVisibilityMap}
              onSplit={onSplit}
              onRemove={onRemove}
              isDragging={isDragging}
              onNoteContentChange={onNoteContentChange}
              onToggleBorder={onToggleBorder}
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
  const toggleNoteBorder = useBentoStore((state) => state.toggleNoteBorder)

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

  // Pre-compute which panels should show borders (optimized - runs once per layout change)
  const borderVisibilityMap = useMemo(() => {
    if (!layout) return new Set<string>()
    return computeBorderVisibility(layout)
  }, [layout])

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setDraggedNote(active.data.current?.note as BentoNote)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedNote(null)

    if (!over) return

    const draggedNote = active.data.current?.note as BentoNote
    const targetPanelId = over.id as string
    const sourcePanelId = draggedNote.panelId

    // Don't do anything if dropped on same panel
    if (sourcePanelId === targetPanelId) return

    const targetNote = notesByPanel[targetPanelId]

    if (targetNote) {
      // Swap notes: target note goes to source panel, dragged note goes to target panel
      updateNotePanelId(targetNote.id, sourcePanelId!)
      updateNotePanelId(draggedNote.id, targetPanelId)
    } else {
      // Move to empty panel
      updateNotePanelId(draggedNote.id, targetPanelId)
    }
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

  // Handle border toggle for a note
  const handleToggleBorder = useCallback((noteId: string) => {
    toggleNoteBorder(noteId)
  }, [toggleNoteBorder])

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
            borderVisibilityMap={borderVisibilityMap}
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
            onToggleBorder={handleToggleBorder}
          />
        </div>

        {/* Drag Overlay - with smooth fade drop animation */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'ease-out',
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } }
            })
          } as DropAnimation}
        >
          {draggedNote ? <DraggableNote note={draggedNote} isOverlay /> : null}
        </DragOverlay>
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
