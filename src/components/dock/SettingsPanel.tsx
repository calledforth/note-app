import { useThemeStore, type NoteStyle, NOTE_STYLES, EDITOR_FONTS } from "../../stores/themeStore";
import { useMantraStore } from "../../stores/mantraStore";
import { X } from "lucide-react";
import clsx from "clsx";

interface SettingsPanelProps {
  spaceId: string;
  onClose: () => void;
}

export function SettingsPanel({ spaceId: _spaceId, onClose }: SettingsPanelProps) {
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle);
  const setNoteStyle = useThemeStore((state) => state.setNoteStyle);
  const currentEditorFont = useThemeStore((state) => state.currentEditorFont);
  const setEditorFont = useThemeStore((state) => state.setEditorFont);
  const mantraAutoOpenEnabled = useMantraStore((state) => state.mantraAutoOpenEnabled);
  const setMantraAutoOpenEnabled = useMantraStore((state) => state.setMantraAutoOpenEnabled);

  // Theme-specific styling (match command palette)
  const isZenVoid = currentNoteStyle === 'zen-void';
  const isTestLab = currentNoteStyle === 'test-lab';

  // Get background color based on theme
  const getBgColor = () => {
    if (isZenVoid) return 'var(--note-bg)';
    if (isTestLab) return 'var(--note-bg)';
    return 'var(--note-bg)';
  };

  const getBorderColor = () => {
    if (isZenVoid) return 'var(--note-border)';
    if (isTestLab) return 'var(--note-border)';
    return 'var(--note-border)';
  };

  // Short display names for themes
  const getThemeDisplayName = (key: NoteStyle) => {
    switch (key) {
      case 'wabi-grid': return 'Wabi';
      case 'zen-void': return 'Zen';
      case 'test-lab': return 'Lab';
      default: return key;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel Centering Wrapper */}
      <div className="fixed inset-0 z-101 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-md pointer-events-auto animate-command-palette-in overflow-hidden shadow-2xl rounded-md"
          style={{
            backgroundColor: getBgColor(),
            border: `1px solid ${getBorderColor()}`,
            fontFamily: isZenVoid ? "'Inter', sans-serif" : "'JetBrains Mono', monospace",
          }}
        >
          {/* Header */}
          <header
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${getBorderColor()}` }}
          >
            <div>
              <h1 className={clsx(
                "text-base",
                isZenVoid ? "text-(--note-title) font-light" : "text-(--note-title)"
              )}>
                Settings
              </h1>
            </div>
            <button
              onClick={onClose}
              className={clsx(
                "p-1 rounded transition-colors",
                "text-(--note-control-subtle) hover:text-(--note-control) hover:bg-(--note-control-bg-hover)"
              )}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </header>

          {/* Content */}
          <div className="px-5 py-6 space-y-8">

            {/* Theme Section */}
            <section>
              <div className="flex items-center justify-between">
                <span className={clsx(
                  "text-sm",
                  isZenVoid ? "text-(--note-text) font-light" : "text-(--note-text)"
                )}>
                  Theme
                </span>

                {/* Pill toggle for themes */}
                <div className="flex bg-(--note-control-bg-hover) rounded-full p-0.5">
                  {NOTE_STYLES.map((style) => {
                    const isActive = currentNoteStyle === style.key;
                    return (
                      <button
                        key={style.key}
                        onClick={() => setNoteStyle(style.key)}
                        className={clsx(
                          "px-4 py-1.5 text-xs rounded-full transition-all duration-200",
                          isActive
                          ? "bg-(--note-control-bg-active) text-(--note-control)"
                          : "text-(--note-control-subtle) hover:text-(--note-control-muted)"
                        )}
                      >
                        {getThemeDisplayName(style.key)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${getBorderColor()}` }} />

            {/* Font Section */}
            <section>
              <span className={clsx(
                "text-sm block mb-5",
                isZenVoid ? "text-(--note-text) font-light" : "text-(--note-text)"
              )}>
                Font
              </span>

              {/* Font Cards Grid */}
              <div className="grid grid-cols-4 gap-3">
                {EDITOR_FONTS.map((font) => {
                  const isActive = currentEditorFont === font.key;
                  return (
                    <button
                      key={font.key}
                      onClick={() => setEditorFont(font.key)}
                      className={clsx(
                        "flex flex-col items-center py-4 px-2 rounded-lg transition-all duration-200 border",
                        isActive
                          ? "bg-(--note-control-bg-hover) border-(--note-border-hover)"
                          : "bg-transparent border-transparent hover:bg-(--note-control-bg-hover) hover:border-(--note-border)"
                      )}
                    >
                      {/* Ag Preview */}
                      <span
                        className={clsx(
                          "text-2xl mb-2",
                          isActive ? "text-(--note-control)" : "text-(--note-control-muted)"
                        )}
                        style={{ fontFamily: font.fontFamily }}
                      >
                        Ag
                      </span>
                      {/* Font Name */}
                      <span className={clsx(
                        "text-[10px]",
                        isActive ? "text-(--note-control-muted)" : "text-(--note-control-subtle)"
                      )}>
                        {font.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${getBorderColor()}` }} />

            {/* Mantra Section */}
            <section>
              <div className="flex items-center justify-between">
                <span className={clsx(
                  "text-sm",
                  isZenVoid ? "text-(--note-text) font-light" : "text-(--note-text)"
                )}>
                  Mantra auto-open
                </span>
                <button
                  type="button"
                  aria-pressed={mantraAutoOpenEnabled}
                  onClick={() => setMantraAutoOpenEnabled(!mantraAutoOpenEnabled)}
                  className={clsx(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    mantraAutoOpenEnabled ? "bg-(--note-control-bg-active)" : "bg-(--note-control-bg-hover)"
                  )}
                >
                  <span
                    className={clsx(
                      "inline-block h-4 w-4 transform rounded-full bg-(--note-control) transition-transform",
                      mantraAutoOpenEnabled ? "translate-x-5" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
