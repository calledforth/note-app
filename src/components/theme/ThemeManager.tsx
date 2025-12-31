import { useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';

export function ThemeManager() {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle);
  const getCurrentThemeTokens = useThemeStore((state) => state.getCurrentThemeTokens);

  useEffect(() => {
    const root = document.documentElement;
    const tokens = getCurrentThemeTokens();

    // Set data-theme attribute for CSS selectors
    root.dataset.theme = currentTheme;

    // Set data-note-style attribute for note styling
    root.dataset.noteStyle = currentNoteStyle;

    // Apply CSS custom properties
    root.style.setProperty('--app-bg', tokens.appBg);
    root.style.setProperty('--surface-bg', tokens.surfaceBg);
    root.style.setProperty('--border-subtle', tokens.borderSubtle);
    root.style.setProperty('--text-primary', tokens.textPrimary);
    root.style.setProperty('--text-secondary', tokens.textSecondary);
    root.style.setProperty('--badge-editing-bg', tokens.badgeEditingBg);
    root.style.setProperty('--badge-editing-text', tokens.badgeEditingText);
    root.style.setProperty('--badge-focus-bg', tokens.badgeFocusBg);
    root.style.setProperty('--badge-focus-text', tokens.badgeFocusText);

    // Legacy single badge text variable (kept for safety)
    root.style.setProperty('--badge-text', tokens.badgeEditingText);
  }, [currentTheme, currentNoteStyle, getCurrentThemeTokens]);

  return null; // This component doesn't render anything
}


