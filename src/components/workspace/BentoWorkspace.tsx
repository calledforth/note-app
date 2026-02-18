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
// ============================================================================

const DraggableNote = ({
  noteId,
  isOverlay = false,
  showBorder = true,
  onSplit,
  onRemove,
  onToggleBorder,
}: {
  noteId: string
  isOverlay?: boolean
  showBorder?: boolean
  onSplit?: (direction: "horizontal" | "vertical") => void
  onRemove?: () => void
  onToggleBorder?: () => void
}) => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)
  const currentEditorFont = useThemeStore((state) => state.currentEditorFont)

  const note = useBentoStore((state) => state.notes.find(n => n.id === noteId))

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: noteId,
    data: { note },
    disabled: false,
  })

  // Get container padding - minimal and uniform for all panels
  // Note: Horizontal content padding is handled via CSS (clamp-based responsive padding in .ql-editor)
  const getContentPadding = () => "pl-3 pb-3 pr-1"

  if (!note) return null

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
              "p-1 rounded transition-all duration-150 hover:bg-(--note-control-bg-hover)",
              showBorder
                ? "text-(--note-control-muted) hover:text-(--note-control)"
                : "text-(--note-warning) opacity-80 hover:opacity-100"
            )}
            title={showBorder ? "Hide Border" : "Show Border"}
          >
            {showBorder ? <Square className="w-3 h-3" /> : <SquareDashed className="w-3 h-3" />}
          </button>
          {/* Split vertically */}
          <button
            onClick={(e) => { e.stopPropagation(); onSplit("vertical"); setIsMenuExpanded(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded transition-all duration-150 text-(--note-control-muted) hover:text-(--note-control) hover:bg-(--note-control-bg-hover)"
            title="Split Vertically"
          >
            <Split className="w-3 h-3 rotate-90" />
          </button>
          {/* Split horizontally */}
          <button
            onClick={(e) => { e.stopPropagation(); onSplit("horizontal"); setIsMenuExpanded(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded transition-all duration-150 text-(--note-control-muted) hover:text-(--note-control) hover:bg-(--note-control-bg-hover)"
            title="Split Horizontally"
          >
            <Split className="w-3 h-3" />
          </button>
          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded transition-all duration-150 text-(--note-control-muted) hover:text-(--note-danger) hover:bg-(--note-control-bg-hover)"
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
            "p-1 rounded transition-all duration-150 hover:bg-(--note-control-bg-hover)",
            isMenuExpanded
              ? "text-(--note-control) bg-(--note-control-bg-hover)"
              : "text-(--note-control-subtle) hover:text-(--note-control-muted)"
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
          "bg-(--void-bg)",
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
            className={clsx("flex-1 min-h-0 zen-void-editor", `font-${currentEditorFont}`)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <RichTextEditor noteId={noteId} />
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
          "bg-(--lab-bg)",
          isOverlay && "shadow-2xl z-50 ring-1 ring-(--note-overlay-ring)",
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
            className={clsx("flex-1 min-h-0 test-lab-editor", `font-${currentEditorFont}`)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <RichTextEditor noteId={noteId} />
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
        "bg-(--wabi-bg)",
        isOverlay && "shadow-2xl z-50 ring-1 ring-(--note-overlay-ring)",
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
          className={clsx(
            "flex-1 min-h-0 wabi-grid-editor",
            `font-${currentEditorFont}`
          )}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <RichTextEditor noteId={noteId} />
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
  defaultShowBorder,
  onSplit,
  onRemove,
  onToggleBorder,
}: {
  panelId: string
  defaultShowBorder: boolean
  onSplit: (direction: "horizontal" | "vertical") => void
  onRemove: () => void
  onToggleBorder?: (noteId: string) => void
}) => {
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle)
  const [isPanelHovered, setIsPanelHovered] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: panelId,
  })

  const noteId = useBentoStore((state) =>
    state.notes.find(n => n.panelId === panelId)?.id
  )

  const borderHidden = useBentoStore((state) =>
    state.notes.find(n => n.panelId === panelId)?.borderHidden ?? false
  )

  const showBorder = borderHidden ? false : defaultShowBorder

  const EmptyPanelControls = () => (
    isPanelHovered ? (
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onSplit("vertical"); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded transition-all duration-150 text-(--note-control-muted) hover:text-(--note-control) hover:bg-(--note-control-bg-hover)"
          title="Split Vertically"
        >
          <Split className="w-3 h-3 rotate-90" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSplit("horizontal"); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded transition-all duration-150 text-(--note-control-muted) hover:text-(--note-control) hover:bg-(--note-control-bg-hover)"
          title="Split Horizontally"
        >
          <Split className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded transition-all duration-150 text-(--note-control-muted) hover:text-(--note-danger) hover:bg-(--note-control-bg-hover)"
          title="Remove Panel"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    ) : null
  )

  const getBorderClasses = () => {
    if (!showBorder) {
      return "border border-transparent"
    }
    if (currentNoteStyle === 'zen-void') {
      return "border border-(--note-border) hover:border-(--note-border-hover)"
    }
    if (currentNoteStyle === 'test-lab') {
      return "border border-(--note-border) hover:border-(--note-border-hover) rounded-md"
    }
    return "border border-(--note-border) hover:border-(--note-border-hover) rounded-xs"
  }

  const getDropZoneClasses = () => {
    if (!isOver) return ""
      return "!border-dashed !border-(--note-drop-border) bg-(--note-drop-bg) ring-2 ring-(--note-drop-ring) ring-inset"
  }

  const getDropZoneShadow = () => {
    if (!isOver) return undefined
    return { boxShadow: 'inset 0 0 40px var(--note-drop-shadow)' }
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
      <div className="w-full h-full relative z-0">
        {noteId ? (
          <div key={`${noteId}-${panelId}`} className="w-full h-full note-swap-animation">
            <DraggableNote
              noteId={noteId}
              showBorder={showBorder}
              onSplit={onSplit}
              onRemove={onRemove}
              onToggleBorder={() => onToggleBorder?.(noteId)}
            />
          </div>
        ) : (
          <>
            <EmptyPanelControls />
            {showBorder && (
              <div className={clsx(
                "w-full h-full flex items-center justify-center text-xs pointer-events-none",
                isOver
                  ? "text-(--note-control-muted)"
                  : "text-(--note-control-subtle)"
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
  borderVisibilityMap,
  onSplit,
  onRemove,
  onToggleBorder,
}: {
  node: LayoutNode
  borderVisibilityMap: Set<string>
  onSplit: (panelId: string, direction: "horizontal" | "vertical") => void
  onRemove: (panelId: string) => void
  onToggleBorder?: (noteId: string) => void
}) => {
  if (node.type === "pane") {
    const defaultShowBorder = node.panelId ? borderVisibilityMap.has(node.panelId) : false
    return (
      <PanelContent
        panelId={node.panelId!}
        defaultShowBorder={defaultShowBorder}
        onSplit={(dir) => onSplit(node.id, dir)}
        onRemove={() => onRemove(node.id)}
        onToggleBorder={onToggleBorder}
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
              borderVisibilityMap={borderVisibilityMap}
              onSplit={onSplit}
              onRemove={onRemove}
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
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)

  const currentWorkspace = useBentoStore((state) => state.currentWorkspace())
  const updateWorkspaceLayout = useBentoStore((state) => state.updateWorkspaceLayout)
  const updateNotePanelId = useBentoStore((state) => state.updateNotePanelId)
  const deleteNote = useBentoStore((state) => state.deleteNote)
  const toggleNoteBorder = useBentoStore((state) => state.toggleNoteBorder)

  const layout = currentWorkspace?.layout

  const borderVisibilityMap = useMemo(() => {
    if (!layout) return new Set<string>()
    return computeBorderVisibility(layout)
  }, [layout])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const note = active.data.current?.note as BentoNote | undefined
    setDraggedNoteId(note?.id ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedNoteId(null)

    if (!over) return

    const draggedNote = active.data.current?.note as BentoNote
    const targetPanelId = over.id as string
    const sourcePanelId = draggedNote.panelId

    if (sourcePanelId === targetPanelId) return

    const notes = useBentoStore.getState().notes
    const targetNote = notes.find(n => n.panelId === targetPanelId)

    if (targetNote) {
      updateNotePanelId(targetNote.id, sourcePanelId!)
      updateNotePanelId(draggedNote.id, targetPanelId)
    } else {
      updateNotePanelId(draggedNote.id, targetPanelId)
    }
  }

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

  const handleRemoveWithDelete = useCallback((nodeId: string) => {
    const paneNode = findPaneById(layout!, nodeId)
    if (paneNode?.panelId) {
      const notes = useBentoStore.getState().notes
      const note = notes.find(n => n.panelId === paneNode.panelId)
      if (note) {
        deleteNote(note.id)
      }
    }
    onRemove(nodeId)
  }, [layout, deleteNote, onRemove])

  const handleToggleBorder = useCallback((noteId: string) => {
    toggleNoteBorder(noteId)
  }, [toggleNoteBorder])

  if (!layout) {
    return (
      <div className="h-full w-full flex items-center justify-center text-(--text-secondary)">
        Loading workspace...
      </div>
    )
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full w-full bg-(--app-bg) text-(--text-primary) overflow-hidden flex flex-col font-sans">
        <div className="flex-1 overflow-hidden relative p-2">
          <LayoutRenderer
            node={layout}
            borderVisibilityMap={borderVisibilityMap}
            onSplit={onSplit}
            onRemove={handleRemoveWithDelete}
            onToggleBorder={handleToggleBorder}
          />
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'ease-out',
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } }
            })
          } as DropAnimation}
        >
          {draggedNoteId ? <DraggableNote noteId={draggedNoteId} isOverlay /> : null}
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
