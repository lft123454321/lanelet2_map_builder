export interface PCDHeader {
  version: string;
  fields: string[];
  size: number[];
  type: string[];
  count: number[];
  width: number;
  height: number;
  viewpoint: [number, number, number, number, number, number, number];
  points: number;
  data: 'binary' | 'ascii';
}

export interface PCDPoint {
  x: number;
  y: number;
  z: number;
  intensity?: number;
}

export interface ProcessedPointCloud {
  positions: Float32Array;
  colors: Float32Array;
  intensities: Float32Array;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  center: [number, number, number];
}

export interface PCDConfig {
  targetPointCount: number;
  coloringMode: 'height' | 'intensity' | 'single';
  heightColorRange: [number, number];
  singleColor: string;
  noDownsample?: boolean;
}

export interface GroundGrid {
  resolution: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
  data: Float32Array;
}

export interface GroundExtractionConfig {
  gridResolution: number;
  maxHeightDiff: number;
  searchRadius: number;
  fillHoles: boolean;
}
