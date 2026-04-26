import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { UIState } from '../types';

interface UIStore extends UIState {
  togglePropertiesPanel: () => void;
  togglePrimitiveList: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openImportOSMModal: () => void;
  closeImportOSMModal: () => void;
  openImportPCDModal: () => void;
  closeImportPCDModal: () => void;
}

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    showPropertiesPanel: true,
    showPrimitiveList: false,
    showSettingsModal: false,
    showImportOSMModal: false,
    showImportPCDModal: false,

    togglePropertiesPanel: () =>
      set((state) => {
        state.showPropertiesPanel = !state.showPropertiesPanel;
      }),

    togglePrimitiveList: () =>
      set((state) => {
        state.showPrimitiveList = !state.showPrimitiveList;
      }),

    openSettingsModal: () =>
      set((state) => {
        state.showSettingsModal = true;
      }),

    closeSettingsModal: () =>
      set((state) => {
        state.showSettingsModal = false;
      }),

    openImportOSMModal: () =>
      set((state) => {
        state.showImportOSMModal = true;
      }),

    closeImportOSMModal: () =>
      set((state) => {
        state.showImportOSMModal = false;
      }),

    openImportPCDModal: () =>
      set((state) => {
        state.showImportPCDModal = true;
      }),

    closeImportPCDModal: () =>
      set((state) => {
        state.showImportPCDModal = false;
      }),
  }))
);
