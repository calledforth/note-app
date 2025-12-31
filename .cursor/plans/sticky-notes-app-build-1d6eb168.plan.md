<!-- 1d6eb168-4f64-440f-86d2-4da630050501 4d0f228b-879d-4c4e-ade7-e2c64dbe318a -->
# Sticky Notes Application - Implementation Plan

## Phase 1: Project Setup & Foundation

### 1.1 Initialize React + TypeScript + Vite Project

- Use `npx create-vite@latest sticky-notes-app --template react-ts`
- Configure with pnpm (use `pnpm install` instead of npm)
- Verify TypeScript configuration in `tsconfig.json`

### 1.2 Setup Tailwind CSS with Vite Plugin

- Install Tailwind Vite plugin: `pnpm add -D @tailwindcss/vite`
- Configure `vite.config.ts` to use `@tailwindcss/vite` plugin directly (no PostCSS needed)
- Refer Tailwind CSS docs for proper Vite plugin setup
- Create `tailwind.config.js` with dark theme defaults
- Setup `src/index.css` with Tailwind directives
- Configure minimal black/neutral color palette

### 1.3 Install Core Dependencies

- React Router: `pnpm add react-router-dom`
- Zustand: `pnpm add zustand`
- Layout libraries: `pnpm add react-rnd react-grid-layout`
- Rich text editor: `pnpm add react-quill quill`
- Font: `pnpm add next/font` (for Mono font from Next.js)
- Type definitions: `pnpm add -D @types/react-rnd @types/react-grid-layout @types/react-quill`

### 1.4 Project Structure Setup

Create directory structure:

```
src/
  ├── main.tsx                 # React entry point
  ├── App.tsx                  # Root component
  ├── components/
  │   ├── notes/              # Note components
  │   ├── workspace/          # Workspace/board components
  │   └── dock/               # Unified dock UI component
  ├── stores/                  # Zustand stores
  ├── services/               # Storage abstraction layer
  ├── utils/                  # Utilities (coordinate conversion, etc.)
  ├── hooks/                  # Custom React hooks
  ├── types/                  # TypeScript type definitions
  └── styles/                 # Additional styles
```

## Phase 2: Core Type Definitions & State Management

### 2.1 Define TypeScript Types (`src/types/index.ts`)

- `Note` type: id, spaceId, content (rich text HTML), color, createdAt, updatedAt
- `Space` type: id, name, mode ('freeform' | 'grid'), createdAt, updatedAt
- `FreeformPosition` type: x, y, width, height, zIndex
- `GridPosition` type: x, y, w, h (react-grid-layout format)
- `Theme` type: fontFamily (simplified, only font for now, default Inter)

### 2.2 Create Zustand Store (`src/stores/notesStore.ts`)

- State: spaces[], notes[], currentSpaceId, theme (fontFamily: Inter by default)
- Actions: 
  - `addSpace(name, mode)`
  - `deleteSpace(id)`
  - `switchSpace(id)`
  - `addNote(spaceId, content)`
  - `updateNote(id, updates)`
  - `deleteNote(id)`
  - `updateNotePosition(noteId, mode, position)`
  - `switchMode(spaceId, newMode)`
  - `updateTheme(fontFamily)`

### 2.3 Create Storage Abstraction Layer (`src/services/storage.ts`)

- Interface: `StorageService` with methods for CRUD operations
- Implement `LocalStorageService` using Zustand persistence middleware
- Structure data to match eventual SQLite schema:
  - `spaces` array
  - `notes` array  
  - `freeform_positions` map (noteId -> FreeformPosition)
  - `grid_positions` map (noteId -> GridPosition)
  - `theme` object (fontFamily)
- Prepare for future SQLite migration (keep interface consistent)

## Phase 3: Coordinate Conversion System

### 3.1 Create Coordinate Converter (`src/utils/coordinateConverter.ts`)

- Constants: `GRID_CELL_SIZE = 50` (pixels)
- `freeformToGrid(freeform: FreeformPosition): GridPosition`
  - Convert pixel positions to grid units
  - Formula: `x = floor(freeform.x / GRID_CELL_SIZE)`
- `gridToFreeform(grid: GridPosition): FreeformPosition`
  - Convert grid units to pixel positions
  - Formula: `x = grid.x * GRID_CELL_SIZE`
- `convertAllNotes(notes, fromMode, toMode)` - batch conversion
- `getDefaultFreeformPosition()` - center viewport or next available
- `getDefaultGridPosition(layout)` - next available grid cell

### 3.2 Mode Switching Logic (`src/utils/modeSwitcher.ts`)

- `switchToGridMode(spaceId, notes)` - convert freeform → grid
- `switchToFreeformMode(spaceId, notes)` - convert grid → freeform
- Check if target mode coordinates exist before converting
- Store converted coordinates in Zustand store

## Phase 4: Freeform Mode Implementation

### 4.1 Create Freeform Workspace Component (`src/components/workspace/FreeformWorkspace.tsx`)

- Use `react-rnd` for draggable/resizable notes
- Container with fixed viewport (no scroll initially, can add pan/zoom later)
- Handle `onDragStop` and `onResizeStop` callbacks
- Update Zustand store with new positions (debounced)

### 4.2 Create Note Component (`src/components/notes/Note.tsx`)

- Render note content using RichTextEditor component
- Apply note color from theme/note properties
- Handle drag/resize events
- Support z-index for stacking in freeform mode
- Apply theme font (Inter) to note content

### 4.3 New Note Creation in Freeform

- Calculate default position (center or next available)
- Auto-calculate grid position using converter
- Store both coordinate systems in Zustand

## Phase 5: Grid Mode Implementation

### 5.1 Create Grid Workspace Component (`src/components/workspace/GridWorkspace.tsx`)

- Use `react-grid-layout` GridLayout component
- Configure: `cols={12}`, `rowHeight={50}`, `margin={[5,5]}`
- Set `allowOverlap={false}` (default, prevents overlaps)
- Handle `onLayoutChange` callback
- Implement "zoom to fit" or dynamic expansion (test both)

### 5.2 Integrate Notes with Grid Layout

- Map notes to react-grid-layout format (x, y, w, h)
- Convert from Zustand store format to GridLayout format
- Handle drag/resize in grid mode
- Update Zustand store on layout changes

### 5.3 New Note Creation in Grid

- Default size: 2×2 grid cells (100px × 100px)
- Position: next available cell or `y: Infinity` for vertical compaction
- Auto-calculate freeform position using converter

## Phase 6: Rich Text Editor Integration

### 6.1 Create Rich Text Editor Component (`src/components/notes/RichTextEditor.tsx`)

- Use `react-quill` with Quill.js
- Configure Quill toolbar with essential formatting (bold, italic, underline, etc.)
- Implement keybinds: Ctrl+B for bold, Ctrl+I for italic, etc.
- Store HTML content in note.content
- Apply theme font (Inter from next/font) to editor
- Style editor to match dark theme (black/neutral)

## Phase 7: Unified Dock UI & Space Management

### 7.1 Create Unified Dock Component (`src/components/dock/Dock.tsx`)

- Single unified dock UI component (no separate sidebar)
- Contains: Settings icon, Space switcher, Space management controls
- Settings panel opens as overlay/modal when settings icon clicked
- Collapsed dock showing only icons (hover to expand)
- Use Inter font from next/font for dock UI
- Glassmorphic styling (subtle, minimal)

### 7.2 Create Settings Panel Component (`src/components/dock/SettingsPanel.tsx`)

- Opens as overlay/modal from dock
- Space settings: toggle between freeform/grid mode
- Theme settings: font selection (Inter font by default, single theme for now)
- Mode switching triggers coordinate conversion
- Apply Inter font to settings panel

### 7.3 Space Management in Dock

- List all spaces in dock
- Allow creating new spaces (with mode selection)
- Allow deleting spaces
- Switch between spaces
- All space management UI integrated into single dock component

## Phase 8: Electron Integration

### 8.1 Install Electron Forge

- `pnpm add -D @electron-forge/cli`
- `pnpm add -D @electron-forge/plugin-vite`
- Initialize: `npx electron-forge import` (if needed) or setup manually

### 8.2 Configure Electron Forge (`forge.config.ts`)

- Setup Vite plugin configuration
- Electron Forge auto-generates preload scripts and basic structure by default
- Configure main process entry: `src/main/main.ts` (if custom path needed)
- Configure renderer: point to existing Vite React app
- Most configuration handled by default via Electron Forge CLI

### 8.3 Create Electron Main Process (`src/main/main.ts`)

- Create BrowserWindow with custom title bar
- Setup window controls (close, minimize, maximize)
- Configure for dark theme
- Handle window state persistence

### 8.4 Create Preload Script (`src/preload/preload.ts`)

- Use `contextBridge` for secure IPC
- Expose necessary APIs to renderer
- Setup for future auto-updater integration
- Note: Electron Forge may auto-generate this, customize as needed

### 8.5 Update Vite Config for Electron

- Configure build outputs for Electron
- Setup HMR for Electron development
- Externalize Node.js modules if needed

## Phase 9: Styling & Theme

### 9.1 Apply Dark Theme & Fonts

- Black/neutral color palette only
- Minimal styling, no animations/effects
- Simple title bar styling
- Glassmorphic dock (subtle, minimal)
- Apply Inter font from next/font to entire app (default theme)
- Theme system ready for future expansion (currently only font selection)

### 9.2 Responsive Layout

- Workspace fills available space
- Dock positioned (left/right/bottom - TBD)
- Settings panel as overlay/modal

## Phase 10: Testing & Refinement

### 10.1 Test Mode Switching

- Freeform → Grid conversion accuracy
- Grid → Freeform conversion accuracy
- Layout preservation in each mode

### 10.2 Test Note Operations

- Create note in freeform mode
- Create note in grid mode
- Drag/resize in both modes
- Delete notes
- Rich text editing functionality

### 10.3 Test Space Management

- Create multiple spaces
- Switch between spaces
- Delete spaces
- Settings panel functionality

## Future Considerations (Not in Initial Plan)

- SQLite migration (prepare abstraction layer)
- Auto-updater setup (Electron Forge handles this)
- System tray (optional)
- Search functionality
- Export functionality
- Expanded theme customization (colors, borders, etc.)

## Key Files to Create/Modify

**Core Setup:**

- `package.json` - dependencies and scripts
- `vite.config.ts` - Vite + Tailwind Vite plugin configuration
- `tailwind.config.js` - Tailwind theme config
- `tsconfig.json` - TypeScript configuration

**Application Code:**

- `src/types/index.ts` - Type definitions
- `src/stores/notesStore.ts` - Zustand store
- `src/services/storage.ts` - Storage abstraction
- `src/utils/coordinateConverter.ts` - Coordinate conversion
- `src/components/workspace/FreeformWorkspace.tsx`
- `src/components/workspace/GridWorkspace.tsx`
- `src/components/notes/Note.tsx`
- `src/components/notes/RichTextEditor.tsx` - Quill.js editor
- `src/components/dock/Dock.tsx` - Unified dock with settings and space management
- `src/components/dock/SettingsPanel.tsx` - Settings overlay/modal

**Electron:**

- `forge.config.ts` - Electron Forge config (mostly auto-generated)
- `src/main/main.ts` - Main process
- `src/preload/preload.ts` - Preload script (may be auto-generated)