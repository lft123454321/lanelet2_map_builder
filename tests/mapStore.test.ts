import { test, expect } from '@playwright/test';
import { useMapStore } from '../src/store/mapStore';

test.describe('mapStore', () => {
  test.beforeEach(() => {
    useMapStore.getState().clearMap();
  });

  test('addPoint creates a point with correct properties', () => {
    const pointId = useMapStore.getState().addPoint(1, 2, 3);
    const point = useMapStore.getState().getPoint(pointId);

    expect(point).toBeDefined();
    expect(point?.x).toBe(1);
    expect(point?.y).toBe(2);
    expect(point?.z).toBe(3);
    expect(pointId).toMatch(/^p\d+$/);
  });

  test('deleteLinestring removes linestring and unused points', () => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(1, 0, 0);
    const p3 = useMapStore.getState().addPoint(2, 0, 0);

    const ls1 = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const ls2 = useMapStore.getState().addLinestring([p2, p3], 'line_thin', 'solid');

    useMapStore.getState().deleteLinestring(ls1);

    expect(useMapStore.getState().getLinestring(ls1)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p1)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p2)).toBeDefined();
    expect(useMapStore.getState().getPoint(p3)).toBeDefined();
  });

  test('deleteLinestring keeps point used by other linestrings', () => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(1, 0, 0);

    const ls1 = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const ls2 = useMapStore.getState().addLinestring([p2, p1], 'line_thin', 'solid');

    useMapStore.getState().deleteLinestring(ls1);

    expect(useMapStore.getState().getLinestring(ls1)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p1)).toBeDefined();
    expect(useMapStore.getState().getPoint(p2)).toBeDefined();
  });

  test('deleteLanelet removes lanelet and orphaned boundaries', () => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(1, 0, 0);
    const p3 = useMapStore.getState().addPoint(0, 1, 0);
    const p4 = useMapStore.getState().addPoint(1, 1, 0);

    const leftLs = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const rightLs = useMapStore.getState().addLinestring([p3, p4], 'line_thin', 'solid');

    const laneletId = useMapStore.getState().addLanelet(leftLs, rightLs);

    useMapStore.getState().deleteLanelet(laneletId);

    expect(useMapStore.getState().getLanelet(laneletId)).toBeUndefined();
    expect(useMapStore.getState().getLinestring(leftLs)).toBeUndefined();
    expect(useMapStore.getState().getLinestring(rightLs)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p1)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p2)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p3)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p4)).toBeUndefined();
  });

  test('deleteLanelet keeps boundaries used by other lanelets', () => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(1, 0, 0);
    const p3 = useMapStore.getState().addPoint(0, 1, 0);
    const p4 = useMapStore.getState().addPoint(1, 1, 0);
    const p5 = useMapStore.getState().addPoint(2, 0, 0);
    const p6 = useMapStore.getState().addPoint(2, 1, 0);

    const leftLs1 = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const rightLs1 = useMapStore.getState().addLinestring([p3, p4], 'line_thin', 'solid');
    const leftLs2 = useMapStore.getState().addLinestring([p2, p5], 'line_thin', 'solid');
    const rightLs2 = useMapStore.getState().addLinestring([p4, p6], 'line_thin', 'solid');

    const lanelet1 = useMapStore.getState().addLanelet(leftLs1, rightLs1);
    const lanelet2 = useMapStore.getState().addLanelet(leftLs2, rightLs2);

    useMapStore.getState().deleteLanelet(lanelet1);

    expect(useMapStore.getState().getLanelet(lanelet1)).toBeUndefined();
    expect(useMapStore.getState().getLanelet(lanelet2)).toBeDefined();
    expect(useMapStore.getState().getLinestring(leftLs1)).toBeUndefined();
    expect(useMapStore.getState().getLinestring(rightLs1)).toBeUndefined();
    expect(useMapStore.getState().getLinestring(leftLs2)).toBeDefined();
    expect(useMapStore.getState().getLinestring(rightLs2)).toBeDefined();
  });
});

test.describe('lanelet creation with snapping', () => {
  test.beforeEach(() => {
    useMapStore.getState().clearMap();
  });

  test('linestrings created during lanelet drawing should reuse snapped points', () => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(1, 0, 0);
    const p3 = useMapStore.getState().addPoint(1, 1, 0);
    const p4 = useMapStore.getState().addPoint(0, 1, 0);

    const leftLs = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const rightLs = useMapStore.getState().addLinestring([p4, p3], 'line_thin', 'solid');

    const laneletId = useMapStore.getState().addLanelet(leftLs, rightLs);
    const lanelet = useMapStore.getState().getLanelet(laneletId);

    expect(lanelet?.leftBound).toBe(leftLs);
    expect(lanelet?.rightBound).toBe(rightLs);

    const leftLinestring = useMapStore.getState().getLinestring(leftLs);
    expect(leftLinestring?.points).toEqual([p1, p2]);

    const rightLinestring = useMapStore.getState().getLinestring(rightLs);
    expect(rightLinestring?.points).toEqual([p4, p3]);
  });
});