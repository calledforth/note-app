import { useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import { useThemeStore, type ThemeKey } from "../../stores/themeStore";
import { switchSpaceMode } from "../../utils/modeSwitcher";
import type { SpaceMode } from "../../types";
import { Layout, Grid3X3, LayoutTemplate, X, Check, Type, Palette } from "lucide-react";
import clsx from "clsx";

interface SettingsPanelProps {
  spaceId: string;
  onClose: () => void;
}

export function SettingsPanel({ spaceId, onClose }: SettingsPanelProps) {
  const space = useNotesStore((state) =>
    state.spaces.find((s) => s.id === spaceId)
  );
  const theme = useNotesStore((state) => state.theme);
  const updateTheme = useNotesStore((state) => state.updateTheme);
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const [selectedMode, setSelectedMode] = useState<SpaceMode>(
    space?.mode || "freeform"
  );

  if (!space) return null;

  const handleModeChange = (newMode: SpaceMode) => {
    setSelectedMode(newMode);
    if (newMode !== space.mode) {
      switchSpaceMode(spaceId, newMode);
    }
  };

  const handleFontChange = (fontFamily: string) => {
    updateTheme(fontFamily);
  };

  const themes: { key: ThemeKey; label: string; color: string }[] = [
    { key: "neutral", label: "Neutral", color: "#171717" },
    { key: "black", label: "Midnight", color: "#000000" },
    { key: "white", label: "Clean", color: "#ffffff" },
  ];

  const layouts = [
    {
      mode: "freeform" as SpaceMode,
      icon: Layout,
      label: "Freeform",
      desc: "Infinite canvas",
    },
    {
      mode: "grid" as SpaceMode,
      icon: Grid3X3,
      label: "Grid",
      desc: "Auto-aligned",
    },
    {
      mode: "bento" as SpaceMode,
      icon: LayoutTemplate,
      label: "Bento",
      desc: "Masonry style",
    },
  ];

  const fonts = [
    { name: "Inter", label: "Inter" },
    { name: "system-ui", label: "System UI" },
    { name: "Arial", label: "Arial" },
    { name: "Helvetica", label: "Helvetica" },
  ];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="w-[460px] bg-[var(--surface-bg)] rounded-3xl shadow-2xl border border-[var(--border-subtle)]/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-7 pt-7 pb-2 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Customize your space
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 -mt-1.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--app-bg)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Content */}
        <div className="px-7 pb-7 space-y-7 overflow-y-auto">

          {/* Appearance Section */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-[var(--text-primary)]">
              <Palette className="w-3.5 h-3.5" />
              <h3 className="text-xs font-medium uppercase tracking-wide opacity-80">Appearance</h3>
            </div>

            {/* 
                Changes: 
                - Increased gap (gap-3) to stop borders clashing
                - Reduced height (h-14 instead of h-20)
                - Removed container padding/background to keep it clean
            */}
            <div className="flex gap-3">
              {themes.map((t) => {
                const isActive = currentTheme === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={clsx(
                      "flex-1 relative group h-14 rounded-xl transition-all duration-300 ease-out overflow-hidden border",
                      isActive
                        ? "border-[var(--text-primary)] ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--surface-bg)]"
                        : "border-[var(--border-subtle)] hover:border-[var(--text-secondary)]"
                    )}
                  >
                    <div
                      className="absolute inset-0 transition-transform duration-500"
                      style={{ backgroundColor: t.color }}
                    />

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      {isActive && (
                        <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-0.5 animate-in zoom-in duration-200">
                          <Check className={clsx("w-3 h-3", t.key === 'white' ? 'text-black' : 'text-white')} />
                        </div>
                      )}
                      <span className={clsx(
                        "text-[9px] font-bold tracking-wider uppercase transition-all",
                        t.key === 'white' ? 'text-black/70' : 'text-white/70',
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                      )}>
                        {t.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Layout Section */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-[var(--text-primary)]">
              <Layout className="w-3.5 h-3.5" />
              <h3 className="text-xs font-medium uppercase tracking-wide opacity-80">Workspace Layout</h3>
            </div>

            {/* 
                Changes:
                - Reduced padding (p-3)
                - Smaller text sizes
                - Smaller icons
            */}
            <div className="grid grid-cols-3 gap-2">
              {layouts.map(({ mode, icon: Icon, label, desc }) => {
                const isSelected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={clsx(
                      "flex flex-col items-start p-3 rounded-xl transition-all duration-200 border text-left group",
                      isSelected
                        ? "bg-[var(--app-bg)] border-[var(--text-primary)]/30 shadow-sm"
                        : "bg-transparent border-[var(--border-subtle)] hover:bg-[var(--app-bg)]/40 hover:border-[var(--border-subtle)]/80"
                    )}
                  >
                    <div className={clsx(
                      "p-1.5 rounded-lg mb-2 transition-colors",
                      isSelected ? "bg-[var(--surface-bg)] text-[var(--text-primary)]" : "bg-[var(--app-bg)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={clsx("text-xs font-semibold block", isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")}>
                      {label}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 opacity-70">
                      {desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Typography Section */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-[var(--text-primary)]">
              <Type className="w-3.5 h-3.5" />
              <h3 className="text-xs font-medium uppercase tracking-wide opacity-80">Typography</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {fonts.map((f) => {
                const isSelected = theme.fontFamily === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => handleFontChange(f.name)}
                    className={clsx(
                      "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200 flex items-center gap-1.5",
                      isSelected
                        ? "bg-[var(--text-primary)] text-[var(--app-bg)] border-[var(--text-primary)]"
                        : "bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                    )}
                  >
                    <span style={{ fontFamily: f.name }}>{f.label}</span>
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </button>
                )
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}