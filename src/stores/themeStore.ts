import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeKey = 'neutral' | 'black' | 'white';
export type NoteStyle = 'wabi-grid' | 'zen-void' | 'test-lab';

interface ThemeTokens {
  appBg: string;
  surfaceBg: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  badgeEditingBg: string;
  badgeEditingText: string;
  badgeFocusBg: string;
  badgeFocusText: string;
}

const THEMES: Record<ThemeKey, ThemeTokens> = {
  neutral: {
    appBg: '#0c0c0c',
    surfaceBg: '#171717',
    borderSubtle: '#262626',
    textPrimary: '#e5e5e5',
    textSecondary: '#a3a3a3',
    // Editing: consistent blue accent across themes
    badgeEditingBg: '#2563eb',
    badgeEditingText: '#ffffff',
    // Focus: subtle dark grey, glassy in UI
    badgeFocusBg: '#262626',
    badgeFocusText: '#e5e5e5',
  },
  black: {
    appBg: '#000000',
    surfaceBg: '#0f0f0f',
    borderSubtle: '#1f1f1f',
    textPrimary: '#ffffff',
    textSecondary: '#888888',
    // Editing: same blue accent for consistency
    badgeEditingBg: '#2563eb',
    badgeEditingText: '#ffffff',
    // Focus: neutral dark grey, readable text
    badgeFocusBg: '#18181b',
    badgeFocusText: '#e5e5e5',
  },
  white: {
    appBg: '#ffffff',
    surfaceBg: '#f5f5f5',
    borderSubtle: '#e5e5e5',
    textPrimary: '#171717',
    textSecondary: '#737373',
    // Editing: same blue accent, still readable on light
    badgeEditingBg: '#2563eb',
    badgeEditingText: '#ffffff',
    // Focus: light grey, simple and subtle
    badgeFocusBg: '#e5e5e5',
    badgeFocusText: '#171717',
  },
};

// Note style definitions
export const NOTE_STYLES: { key: NoteStyle; name: string; description: string }[] = [
  { key: 'wabi-grid', name: 'Wabi Grid', description: 'Japanese-inspired, serif italic' },
  { key: 'zen-void', name: 'Zen Void', description: 'Minimal, light sans-serif' },
  { key: 'test-lab', name: 'Test Lab', description: 'Experimental playground theme' },
];

interface ThemeStore {
  currentTheme: ThemeKey;
  currentNoteStyle: NoteStyle;
  themes: Record<ThemeKey, ThemeTokens>;
  setTheme: (theme: ThemeKey) => void;
  cycleTheme: () => void;
  getCurrentThemeTokens: () => ThemeTokens;
  setNoteStyle: (style: NoteStyle) => void;
  cycleNoteStyle: () => void;
}

const THEME_ORDER: ThemeKey[] = ['neutral', 'black', 'white'];
const NOTE_STYLE_ORDER: NoteStyle[] = ['wabi-grid', 'zen-void', 'test-lab'];

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: 'neutral',
      currentNoteStyle: 'wabi-grid',
      themes: THEMES,
      setTheme: (theme) => set({ currentTheme: theme }),
      cycleTheme: () => {
        const current = get().currentTheme;
        const currentIndex = THEME_ORDER.indexOf(current);
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = (safeIndex + 1) % THEME_ORDER.length;
        set({ currentTheme: THEME_ORDER[nextIndex] });
      },
      getCurrentThemeTokens: () => {
        const current = get().currentTheme;
        return THEMES[current] ?? THEMES.neutral;
      },
      setNoteStyle: (style) => set({ currentNoteStyle: style }),
      cycleNoteStyle: () => {
        const current = get().currentNoteStyle;
        const currentIndex = NOTE_STYLE_ORDER.indexOf(current);
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = (safeIndex + 1) % NOTE_STYLE_ORDER.length;
        set({ currentNoteStyle: NOTE_STYLE_ORDER[nextIndex] });
      },
    }),
    {
      name: 'sticky-notes-theme',
    }
  )
);

