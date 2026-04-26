import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ProcessedPointCloud, GroundGrid, PCDConfig, GroundExtractionConfig } from '../types';
import type { GroundDetectionResult } from '../utils/geometry/csf';

interface PCDState {
  isLoaded: boolean;
  isLoading: boolean;
  loadingProgress: number;
  pointCloud: ProcessedPointCloud | null;
  groundGrid: GroundGrid | null;
  groundDetection: GroundDetectionResult | null;
  showGroundDetection: boolean;
  config: PCDConfig;
  groundConfig: GroundExtractionConfig;
  setPointCloud: (pc: ProcessedPointCloud) => void;
  setGroundGrid: (grid: GroundGrid) => void;
  setGroundDetection: (result: GroundDetectionResult) => void;
  setShowGroundDetection: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  setConfig: (config: Partial<PCDConfig>) => void;
  setGroundConfig: (config: Partial<GroundExtractionConfig>) => void;
  clearPCD: () => void;
}

const defaultPCDConfig: PCDConfig = {
  targetPointCount: 1000000,
  coloringMode: 'height',
  heightColorRange: [-2, 10],
  singleColor: '#ffffff',
};

const defaultGroundConfig: GroundExtractionConfig = {
  gridResolution: 0.5,
  maxHeightDiff: 0.3,
  searchRadius: 1.0,
  fillHoles: true,
};

export const usePCDStore = create<PCDState>()(
  immer((set) => ({
    isLoaded: false,
    isLoading: false,
    loadingProgress: 0,
    pointCloud: null,
    groundGrid: null,
    groundDetection: null,
    showGroundDetection: false,
    config: defaultPCDConfig,
    groundConfig: defaultGroundConfig,

    setPointCloud: (pc) =>
      set((state) => {
        state.pointCloud = pc;
        state.isLoaded = true;
        state.isLoading = false;
      }),

    setGroundGrid: (grid) =>
      set((state) => {
        state.groundGrid = grid;
      }),

    setGroundDetection: (result) =>
      set((state) => {
        state.groundDetection = result;
      }),

    setShowGroundDetection: (show) =>
      set((state) => {
        state.showGroundDetection = show;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
        if (loading) {
          state.loadingProgress = 0;
        }
      }),

    setProgress: (progress) =>
      set((state) => {
        state.loadingProgress = progress;
      }),

    setConfig: (config) =>
      set((state) => {
        Object.assign(state.config, config);
      }),

    setGroundConfig: (config) =>
      set((state) => {
        Object.assign(state.groundConfig, config);
      }),

    clearPCD: () =>
      set((state) => {
        state.pointCloud = null;
        state.groundGrid = null;
        state.groundDetection = null;
        state.isLoaded = false;
        state.isLoading = false;
        state.loadingProgress = 0;
      }),
  }))
);
