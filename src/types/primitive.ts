export interface Point3D {
  id: string;
  x: number;
  y: number;
  z: number;
  tags: Record<string, string>;
}

export interface Linestring {
  id: string;
  points: string[];
  type: LinestringType;
  subtype: string;
  tags: Record<string, string>;
}

export type LinestringType =
  | 'line_thin'
  | 'line_thick'
  | 'curbstone'
  | 'virtual'
  | 'road_border'
  | 'guard_rail'
  | 'wall'
  | 'fence'
  | 'zebra_marking'
  | 'pedestrian_marking'
  | 'bike_marking'
  | 'keepout'
  | 'jersey_barrier'
  | 'gate'
  | 'door'
  | 'rail'
  | 'arrow'
  | 'stop_line'
  | 'yield_line'
  | 'traffic_sign'
  | 'traffic_light';

export type LinestringSubtype =
  | 'solid'
  | 'solid_solid'
  | 'dashed'
  | 'dashed_solid'
  | 'solid_dashed'
  | 'high'
  | 'low'
  | 'left'
  | 'right'
  | 'straight'
  | 'straight_left'
  | 'straight_right';

export interface Lanelet {
  id: string;
  leftBound: string;
  rightBound: string;
  centerline?: string;
  subtype: LaneletSubtype;
  location: LaneletLocation;
  oneWay: boolean;
  regulatoryElements: string[];
  tags: Record<string, string>;
}

export type LaneletSubtype =
  | 'road'
  | 'highway'
  | 'play_street'
  | 'emergency_lane'
  | 'bus_lane'
  | 'bicycle_lane'
  | 'exit'
  | 'walkway'
  | 'shared_walkway'
  | 'crosswalk'
  | 'stairs'
  | 'parking'
  | 'freespace'
  | 'vegetation'
  | 'keepout'
  | 'building'
  | 'traffic_island';

export type LaneletLocation = 'urban' | 'nonurban';

export interface Area {
  id: string;
  outerBound: string[];
  innerBounds: string[][];
  subtype: string;
  regulatoryElements: string[];
  tags: Record<string, string>;
}

export interface RegulatoryElement {
  id: string;
  subtype: RegulatorySubtype;
  refLine?: string;
  refers: string[];
  cancels: string[];
  refLines: string[];
  cancelLines: string[];
  tags: Record<string, string>;
}

export type RegulatorySubtype =
  | 'traffic_sign'
  | 'traffic_light'
  | 'speed_limit'
  | 'right_of_way'
  | 'all_way_stop';

export interface MapData {
  points: Record<string, Point3D>;
  linestrings: Record<string, Linestring>;
  lanelets: Record<string, Lanelet>;
  areas: Record<string, Area>;
  regulatoryElements: Record<string, RegulatoryElement>;
}
