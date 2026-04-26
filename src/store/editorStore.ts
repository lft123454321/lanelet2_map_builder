import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ToolType, ViewMode, RegulatoryToolMode } from '../types';

interface EditorState {
  activeTool: ToolType;
  regulatoryMode: RegulatoryToolMode;
  selectedIds: string[];
  hoveredId: string | null;
  snapIndicatorId: string | null;
  isDrawing: boolean;
  drawingPoints: string[];
  viewMode: ViewMode;
  laneletLeftBoundId: string | null;
  setActiveTool: (tool: ToolType) => void;
  setRegulatoryMode: (mode: RegulatoryToolMode) => void;
  setSelectedIds: (ids: string[]) => void;
  setHoveredId: (id: string | null) => void;
  setSnapIndicatorId: (id: string | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  addDrawingPoint: (pointId: string) => void;
  clearDrawingPoints: () => void;
  setViewMode: (mode: ViewMode) => void;
  setLaneletLeftBoundId: (id: string | null) => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    activeTool: 'select',
    regulatoryMode: 'speed_limit',
    selectedIds: [],
    hoveredId: null,
    snapIndicatorId: null,
    isDrawing: false,
    drawingPoints: [],
    viewMode: '2d',
    laneletLeftBoundId: null,

    setActiveTool: (tool) =>
      set((state) => {
        state.activeTool = tool;
        if (tool !== 'linestring' && tool !== 'point' && tool !== 'lanelet') {
          state.isDrawing = false;
          state.drawingPoints = [];
          state.laneletLeftBoundId = null;
        }
      }),

    setRegulatoryMode: (mode) =>
      set((state) => {
        state.regulatoryMode = mode;
      }),

    setSelectedIds: (ids) =>
      set((state) => {
        state.selectedIds = ids;
      }),

    setHoveredId: (id) =>
      set((state) => {
        state.hoveredId = id;
      }),

    setSnapIndicatorId: (id) =>
      set((state) => {
        state.snapIndicatorId = id;
      }),

    setIsDrawing: (isDrawing) =>
      set((state) => {
        state.isDrawing = isDrawing;
      }),

    addDrawingPoint: (pointId) =>
      set((state) => {
        state.drawingPoints.push(pointId);
      }),

    clearDrawingPoints: () =>
      set((state) => {
        state.drawingPoints = [];
      }),

    setLaneletLeftBoundId: (id) =>
      set((state) => {
        state.laneletLeftBoundId = id;
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),
  }))
);
