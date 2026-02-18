import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { electronStoreStorage } from '../utils/electronStoreStorage';

export type ThemeKey = 'neutral' | 'black' | 'white';
export type NoteStyle = 'wabi-grid' | 'zen-void' | 'test-lab';
export type EditorFont = 'mono' | 'geist' | 'hanken' | 'sen' | 'inter';

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

// Editor font definitions
export const EDITOR_FONTS: { key: EditorFont; name: string; description: string; fontFamily: string }[] = [
  { key: 'mono', name: 'Mono', description: 'JetBrains Mono', fontFamily: "'JetBrains Mono', monospace" },
  { key: 'geist', name: 'Geist', description: 'Clean sans-serif', fontFamily: "'Geist', system-ui, sans-serif" },
  { key: 'hanken', name: 'Hanken', description: 'Hanken Grotesk', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
  { key: 'sen', name: 'Sen', description: 'Geohumanist sans', fontFamily: "'Sen', system-ui, sans-serif" },
  { key: 'inter', name: 'Inter', description: 'Clean UI sans-serif', fontFamily: "'Inter', system-ui, sans-serif" },
];

interface ThemeStore {
  currentTheme: ThemeKey;
  currentNoteStyle: NoteStyle;
  currentEditorFont: EditorFont;
  themes: Record<ThemeKey, ThemeTokens>;
  setTheme: (theme: ThemeKey) => void;
  cycleTheme: () => void;
  getCurrentThemeTokens: () => ThemeTokens;
  setNoteStyle: (style: NoteStyle) => void;
  cycleNoteStyle: () => void;
  setEditorFont: (font: EditorFont) => void;
  cycleEditorFont: () => void;
}

const THEME_ORDER: ThemeKey[] = ['neutral', 'black', 'white'];
const NOTE_STYLE_ORDER: NoteStyle[] = ['wabi-grid', 'zen-void', 'test-lab'];
const EDITOR_FONT_ORDER: EditorFont[] = ['mono', 'geist', 'hanken', 'sen', 'inter'];

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: 'neutral',
      currentNoteStyle: 'wabi-grid',
      currentEditorFont: 'geist',
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
      setEditorFont: (font) => set({ currentEditorFont: font }),
      cycleEditorFont: () => {
        const current = get().currentEditorFont;
        const currentIndex = EDITOR_FONT_ORDER.indexOf(current);
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = (safeIndex + 1) % EDITOR_FONT_ORDER.length;
        set({ currentEditorFont: EDITOR_FONT_ORDER[nextIndex] });
      },
    }),
    {
      name: 'sticky-notes-theme',
      storage: createJSONStorage(() => electronStoreStorage),
    }
  )
);

