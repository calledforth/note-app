import { create } from 'zustand'

export type UiMode = 'focus' | 'dashboard'

interface UiStore {
  uiMode: UiMode
  setMode: (mode: UiMode) => void
  enterFocus: () => void
  enterDashboard: () => void
  toggleMode: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  uiMode: 'focus',
  setMode: (mode) => set({ uiMode: mode }),
  enterFocus: () => set({ uiMode: 'focus' }),
  enterDashboard: () => set({ uiMode: 'dashboard' }),
  toggleMode: () =>
    set((state) => ({
      uiMode: state.uiMode === 'focus' ? 'dashboard' : 'focus',
    })),
}))


