import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { electronStoreStorage } from '../utils/electronStoreStorage';

interface MantraStore {
    // The date string (YYYY-MM-DD) of the last completed mantra
    lastCompletedDate: string | null;

    // Toggle for auto-opening mantra on startup
    mantraAutoOpenEnabled: boolean;

    // Check if mantra has been completed today
    isMantraCompletedToday: () => boolean;

    // Check if we should show the mantra on startup
    shouldShowMantraOnStartup: () => boolean;

    // Mark mantra as completed for today
    completeMantra: () => void;

    // Update the auto-open setting
    setMantraAutoOpenEnabled: (enabled: boolean) => void;

    // Reset for testing purposes
    resetMantra: () => void;
}

// Helper to get today's date as YYYY-MM-DD
const getTodayDateString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

export const useMantraStore = create<MantraStore>()(
    persist(
        (set, get) => ({
            lastCompletedDate: null,
            mantraAutoOpenEnabled: false,

            isMantraCompletedToday: () => {
                const { lastCompletedDate } = get();
                return lastCompletedDate === getTodayDateString();
            },

            shouldShowMantraOnStartup: () => {
                const { lastCompletedDate } = get();
                const today = getTodayDateString();
                // Show if not completed today
                return lastCompletedDate !== today;
            },

            completeMantra: () => {
                set({ lastCompletedDate: getTodayDateString() });
            },

            setMantraAutoOpenEnabled: (enabled: boolean) => {
                set({ mantraAutoOpenEnabled: enabled });
            },

            resetMantra: () => {
                set({ lastCompletedDate: null });
            },
        }),
        {
            name: 'sticky-notes-mantra',
            storage: createJSONStorage(() => electronStoreStorage),
        }
    )
);

export { getTodayDateString };
