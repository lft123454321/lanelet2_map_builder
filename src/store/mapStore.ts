import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  MapData,
  Point3D,
  Linestring,
  Lanelet,
  Area,
  RegulatoryElement,
} from '../types';
import { generateId } from '../utils/id';

interface MapState extends MapData {
  addPoint: (x: number, y: number, z: number, tags?: Record<string, string>) => string;
  updatePoint: (id: string, updates: Partial<Point3D>) => void;
  deletePoint: (id: string) => void;

  addLinestring: (points: string[], type: Linestring['type'], subtype: string, tags?: Record<string, string>) => string;
  updateLinestring: (id: string, updates: Partial<Linestring>) => void;
  deleteLinestring: (id: string) => void;

  addLanelet: (
    leftBound: string,
    rightBound: string,
    subtype?: Lanelet['subtype'],
    tags?: Record<string, string>
  ) => string;
  updateLanelet: (id: string, updates: Partial<Lanelet>) => void;
  deleteLanelet: (id: string) => void;

  addArea: (outerBound: string[], subtype?: string, tags?: Record<string, string>) => string;
  updateArea: (id: string, updates: Partial<Area>) => void;
  deleteArea: (id: string) => void;

  addRegulatoryElement: (
    subtype: RegulatoryElement['subtype'],
    refers: string[],
    tags?: Record<string, string>
  ) => string;
  updateRegulatoryElement: (id: string, updates: Partial<RegulatoryElement>) => void;
  deleteRegulatoryElement: (id: string) => void;

  getPoint: (id: string) => Point3D | undefined;
  getLinestring: (id: string) => Linestring | undefined;
  getLanelet: (id: string) => Lanelet | undefined;
  getArea: (id: string) => Area | undefined;
  getRegulatoryElement: (id: string) => RegulatoryElement | undefined;

  deletePrimitive: (id: string) => void;
  clearMap: () => void;
  loadMap: (data: MapData) => void;
}

const initialState: MapData = {
  points: {},
  linestrings: {},
  lanelets: {},
  areas: {},
  regulatoryElements: {},
};

export const useMapStore = create<MapState>()(
  immer((set, get) => ({
    ...initialState,

    addPoint: (x, y, z, tags = {}) => {
      const id = generateId('p');
      set((state) => {
        state.points[id] = { id, x, y, z, tags };
      });
      return id;
    },

    updatePoint: (id, updates) =>
      set((state) => {
        if (state.points[id]) {
          Object.assign(state.points[id], updates);
        }
      }),

    deletePoint: (id) =>
      set((state) => {
        delete state.points[id];
      }),

    addLinestring: (points, type, subtype, tags = {}) => {
      const id = generateId('l');
      set((state) => {
        state.linestrings[id] = {
          id,
          points,
          type,
          subtype: subtype || 'solid',
          tags,
        };
      });
      return id;
    },

    updateLinestring: (id, updates) =>
      set((state) => {
        if (state.linestrings[id]) {
          Object.assign(state.linestrings[id], updates);
        }
      }),

    deleteLinestring: (id) =>
      set((state) => {
        const linestring = state.linestrings[id];
        if (!linestring) return;

        const pointIds = linestring.points;

        for (const pointId of pointIds) {
          let usedByOthers = false;
          for (const [lsId, ls] of Object.entries(state.linestrings)) {
            if (lsId !== id && ls.points.includes(pointId)) {
              usedByOthers = true;
              break;
            }
          }
          if (!usedByOthers) {
            delete state.points[pointId];
          }
        }

        delete state.linestrings[id];
      }),

    addLanelet: (leftBound, rightBound, subtype = 'road', tags = {}) => {
      const id = generateId('lanelet');
      set((state) => {
        state.lanelets[id] = {
          id,
          leftBound,
          rightBound,
          subtype,
          location: 'urban',
          oneWay: true,
          regulatoryElements: [],
          tags,
        };
      });
      return id;
    },

    updateLanelet: (id, updates) =>
      set((state) => {
        if (state.lanelets[id]) {
          Object.assign(state.lanelets[id], updates);
        }
      }),

    deleteLanelet: (id) =>
      set((state) => {
        const lanelet = state.lanelets[id];
        if (!lanelet) return;

        const leftBoundId = lanelet.leftBound;
        const rightBoundId = lanelet.rightBound;

        let leftUsedByOthers = false;
        let rightUsedByOthers = false;

        for (const [llId, ll] of Object.entries(state.lanelets)) {
          if (llId !== id) {
            if (ll.leftBound === leftBoundId || ll.rightBound === leftBoundId) {
              leftUsedByOthers = true;
            }
            if (ll.leftBound === rightBoundId || ll.rightBound === rightBoundId) {
              rightUsedByOthers = true;
            }
          }
        }

        if (!leftUsedByOthers && leftBoundId) {
          const leftLinestring = state.linestrings[leftBoundId];
          if (leftLinestring) {
            for (const pointId of leftLinestring.points) {
              let pointUsedByOthers = false;
              for (const [lsId, ls] of Object.entries(state.linestrings)) {
                if (lsId !== leftBoundId && ls.points.includes(pointId)) {
                  pointUsedByOthers = true;
                  break;
                }
              }
              if (!pointUsedByOthers) {
                delete state.points[pointId];
              }
            }
            delete state.linestrings[leftBoundId];
          }
        }

        if (!rightUsedByOthers && rightBoundId) {
          const rightLinestring = state.linestrings[rightBoundId];
          if (rightLinestring) {
            for (const pointId of rightLinestring.points) {
              let pointUsedByOthers = false;
              for (const [lsId, ls] of Object.entries(state.linestrings)) {
                if (lsId !== rightBoundId && ls.points.includes(pointId)) {
                  pointUsedByOthers = true;
                  break;
                }
              }
              if (!pointUsedByOthers) {
                delete state.points[pointId];
              }
            }
            delete state.linestrings[rightBoundId];
          }
        }

        delete state.lanelets[id];
      }),

    addArea: (outerBound, subtype = 'freespace', tags = {}) => {
      const id = generateId('area');
      set((state) => {
        state.areas[id] = {
          id,
          outerBound,
          innerBounds: [],
          subtype,
          regulatoryElements: [],
          tags,
        };
      });
      return id;
    },

    updateArea: (id, updates) =>
      set((state) => {
        if (state.areas[id]) {
          Object.assign(state.areas[id], updates);
        }
      }),

    deleteArea: (id) =>
      set((state) => {
        delete state.areas[id];
      }),

    addRegulatoryElement: (subtype, refers, tags = {}) => {
      const id = generateId('reg');
      set((state) => {
        state.regulatoryElements[id] = {
          id,
          subtype,
          refers,
          cancels: [],
          refLines: [],
          cancelLines: [],
          tags,
        };
      });
      return id;
    },

    updateRegulatoryElement: (id, updates) =>
      set((state) => {
        if (state.regulatoryElements[id]) {
          Object.assign(state.regulatoryElements[id], updates);
        }
      }),

    deleteRegulatoryElement: (id) =>
      set((state) => {
        delete state.regulatoryElements[id];
      }),

    getPoint: (id) => get().points[id],
    getLinestring: (id) => get().linestrings[id],
    getLanelet: (id) => get().lanelets[id],
    getArea: (id) => get().areas[id],
    getRegulatoryElement: (id) => get().regulatoryElements[id],

    deletePrimitive: (id) =>
      set((state) => {
        if (state.points[id]) {
          for (const ls of Object.values(state.linestrings)) {
            ls.points = ls.points.filter((pid) => pid !== id);
          }
          delete state.points[id];
        } else if (state.linestrings[id]) {
          for (const [llid, ll] of Object.entries(state.lanelets)) {
            if (ll.leftBound === id || ll.rightBound === id) {
              delete state.lanelets[llid];
            }
          }
          const linestring = state.linestrings[id];
          if (linestring) {
            for (const pointId of linestring.points) {
              let usedByOthers = false;
              for (const [lsId, ls] of Object.entries(state.linestrings)) {
                if (lsId !== id && ls.points.includes(pointId)) {
                  usedByOthers = true;
                  break;
                }
              }
              if (!usedByOthers) {
                delete state.points[pointId];
              }
            }
          }
          delete state.linestrings[id];
        } else if (state.lanelets[id]) {
          const lanelet = state.lanelets[id];
          if (!lanelet) return;

          const others = Object.values(state.lanelets).filter((ll) => ll.id !== id);

          const leftUsed = others.some((ll) => ll.leftBound === lanelet.leftBound || ll.rightBound === lanelet.leftBound);
          const rightUsed = others.some((ll) => ll.leftBound === lanelet.rightBound || ll.rightBound === lanelet.rightBound);

          if (!leftUsed && lanelet.leftBound) delete state.linestrings[lanelet.leftBound];
          if (!rightUsed && lanelet.rightBound) delete state.linestrings[lanelet.rightBound];

          // Clean up orphaned points from deleted boundaries
          const deletedLinestringIds = new Set<string>();
          if (!leftUsed && lanelet.leftBound) deletedLinestringIds.add(lanelet.leftBound);
          if (!rightUsed && lanelet.rightBound) deletedLinestringIds.add(lanelet.rightBound);

          for (const lsId of deletedLinestringIds) {
            const ls = Object.values(state.linestrings).find(s => s.id === lsId);
            if (!ls) continue;
            for (const pointId of ls.points) {
              let usedByOthers = false;
              for (const otherLs of Object.values(state.linestrings)) {
                if (!deletedLinestringIds.has(otherLs.id) && otherLs.points.includes(pointId)) {
                  usedByOthers = true;
                  break;
                }
              }
              if (!usedByOthers) {
                delete state.points[pointId];
              }
            }
          }

          delete state.lanelets[id];
        } else if (state.areas[id]) {
          delete state.areas[id];
        } else if (state.regulatoryElements[id]) {
          delete state.regulatoryElements[id];
        }
      }),

    clearMap: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),

    loadMap: (data) =>
      set((state) => {
        Object.assign(state, data);
      }),
  }))
);
