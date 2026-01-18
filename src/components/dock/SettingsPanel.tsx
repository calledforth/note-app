import { useThemeStore, type ThemeKey, EDITOR_FONTS } from "../../stores/themeStore";
import { X, Check, Type, Palette } from "lucide-react";
import clsx from "clsx";

interface SettingsPanelProps {
  spaceId: string;
  onClose: () => void;
}

export function SettingsPanel({ spaceId: _spaceId, onClose }: SettingsPanelProps) {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const currentEditorFont = useThemeStore((state) => state.currentEditorFont);
  const setEditorFont = useThemeStore((state) => state.setEditorFont);

  const themes: { key: ThemeKey; label: string; color: string }[] = [
    { key: "neutral", label: "Neutral", color: "#171717" },
    { key: "black", label: "Midnight", color: "#000000" },
    { key: "white", label: "Clean", color: "#ffffff" },
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

          {/* Typography Section */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-[var(--text-primary)]">
              <Type className="w-3.5 h-3.5" />
              <h3 className="text-xs font-medium uppercase tracking-wide opacity-80">Typography</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {EDITOR_FONTS.map((f) => {
                const isSelected = currentEditorFont === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setEditorFont(f.key)}
                    className={clsx(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 flex items-center gap-2",
                      isSelected
                        ? "bg-[var(--text-primary)] text-[var(--app-bg)] border-[var(--text-primary)]"
                        : "bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                    )}
                  >
                    <span style={{ fontFamily: f.fontFamily }}>{f.name}</span>
                    <span className="text-xs opacity-60">{f.description}</span>
                    {isSelected && <Check className="w-3 h-3" />}
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