import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type DebugPathType = 'fixed' | 'random';

interface DebugState {
  isDebugMode: boolean;
  debugPathType: DebugPathType;
  toggleDebugMode: (value: boolean) => void;
  setDebugPathType: (type: DebugPathType) => void;
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      isDebugMode: false, 
      debugPathType: 'fixed', 
      toggleDebugMode: (value) => set({ isDebugMode: value }),
      setDebugPathType: (type) => set({ debugPathType: type }),
    }),
    {
      name: 'bike-app-debug-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);