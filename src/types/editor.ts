export type ToolType =
  | 'select'
  | 'pan'
  | 'point'
  | 'linestring'
  | 'lanelet'
  | 'area'
  | 'regulatory'
  | 'delete';

export type ViewMode = '2d' | '3d';

export type RegulatoryToolMode = 'speed_limit' | 'traffic_sign' | 'traffic_light' | 'right_of_way';

export interface EditorState {
  activeTool: ToolType;
  regulatoryMode: RegulatoryToolMode;
  selectedIds: string[];
  hoveredId: string | null;
  isDrawing: boolean;
  drawingPoints: string[];
  viewMode: ViewMode;
}

export interface UIState {
  showPropertiesPanel: boolean;
  showPrimitiveList: boolean;
  showSettingsModal: boolean;
  showImportOSMModal: boolean;
  showImportPCDModal: boolean;
}
