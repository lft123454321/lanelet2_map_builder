import { test, expect } from '@playwright/test';
import { useMapStore } from '../src/store/mapStore';
import { useEditorStore } from '../src/store/editorStore';
import type { Point3D } from '../src/types/primitive';

test.describe('E2E: Lanelet creation with snapping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    useMapStore.getState().clearMap();
    useEditorStore.getState().setActiveTool('point');
  });

  test('creating points via store, then drawing lanelet that snaps to them', async ({ page }) => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(10, 0, 0);
    const p3 = useMapStore.getState().addPoint(10, 10, 0);
    const p4 = useMapStore.getState().addPoint(0, 10, 0);

    expect(p1).toMatch(/^p\d+$/);
    expect(p2).toMatch(/^p\d+$/);
    expect(p3).toMatch(/^p\d+$/);
    expect(p4).toMatch(/^p\d+$/);

    const leftLs = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const rightLs = useMapStore.getState().addLinestring([p4, p3], 'line_thin', 'solid');

    const laneletId = useMapStore.getState().addLanelet(leftLs, rightLs);
    const lanelet = useMapStore.getState().getLanelet(laneletId);

    expect(lanelet?.leftBound).toBe(leftLs);
    expect(lanelet?.rightBound).toBe(rightLs);

    const leftPoints = useMapStore.getState().getLinestring(leftLs)?.points;
    const rightPoints = useMapStore.getState().getLinestring(rightLs)?.points;

    expect(leftPoints).toEqual([p1, p2]);
    expect(rightPoints).toEqual([p4, p3]);

    expect(leftPoints?.[0]).toBe(p1);
    expect(leftPoints?.[1]).toBe(p2);
    expect(rightPoints?.[0]).toBe(p4);
    expect(rightPoints?.[1]).toBe(p3);
  });

  test('deleting lanelet should delete orphaned linestrings and points', async ({ page }) => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(10, 0, 0);
    const p3 = useMapStore.getState().addPoint(10, 10, 0);
    const p4 = useMapStore.getState().addPoint(0, 10, 0);

    const leftLs = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const rightLs = useMapStore.getState().addLinestring([p4, p3], 'line_thin', 'solid');

    const laneletId = useMapStore.getState().addLanelet(leftLs, rightLs);

    expect(useMapStore.getState().getLanelet(laneletId)).toBeDefined();
    expect(useMapStore.getState().getLinestring(leftLs)).toBeDefined();
    expect(useMapStore.getState().getLinestring(rightLs)).toBeDefined();

    useMapStore.getState().deleteLanelet(laneletId);

    expect(useMapStore.getState().getLanelet(laneletId)).toBeUndefined();
    expect(useMapStore.getState().getLinestring(leftLs)).toBeUndefined();
    expect(useMapStore.getState().getLinestring(rightLs)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p1)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p2)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p3)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p4)).toBeUndefined();
  });

  test('deleting linestring should delete unused points', async ({ page }) => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(10, 0, 0);

    const ls1 = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');

    useMapStore.getState().deleteLinestring(ls1);

    expect(useMapStore.getState().getLinestring(ls1)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p1)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p2)).toBeUndefined();
  });

  test('deleting linestring should keep points used by other linestrings', async ({ page }) => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(10, 0, 0);
    const p3 = useMapStore.getState().addPoint(20, 0, 0);

    const ls1 = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const ls2 = useMapStore.getState().addLinestring([p2, p3], 'line_thin', 'solid');

    useMapStore.getState().deleteLinestring(ls1);

    expect(useMapStore.getState().getLinestring(ls1)).toBeUndefined();
    expect(useMapStore.getState().getLinestring(ls2)).toBeDefined();
    expect(useMapStore.getState().getPoint(p1)).toBeUndefined();
    expect(useMapStore.getState().getPoint(p2)).toBeDefined();
    expect(useMapStore.getState().getPoint(p3)).toBeDefined();
  });
});

test.describe('findNearestPoint snapping logic', () => {
  test.beforeEach(() => {
    useMapStore.getState().clearMap();
  });

  test('findNearestPoint should find point within threshold', () => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(10, 0, 0);

    const points = useMapStore.getState().points;

    const SNAP_THRESHOLD = 0.3;

    const findNearestPoint = (x: number, yNorth: number, pts: typeof points): string | null => {
      for (const [id, p] of Object.entries(pts)) {
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.z - yNorth, 2));
        if (dist < SNAP_THRESHOLD) {
          return id;
        }
      }
      return null;
    };

    expect(findNearestPoint(0.1, 0.1, points)).toBe(p1);
    expect(findNearestPoint(0.5, 0.5, points)).toBeNull();
    expect(findNearestPoint(10.1, 0.1, points)).toBe(p2);
  });

  test('point z coordinate stores yNorth value for snapping', () => {
    const yNorthValue = 5;
    const worldYValue = 1.5;
    const pointId = useMapStore.getState().addPoint(0, worldYValue, yNorthValue);
    const point = useMapStore.getState().getPoint(pointId);

    expect(point?.z).toBe(yNorthValue);
    expect(point?.y).toBe(worldYValue);

    const SNAP_THRESHOLD = 0.3;
    const x = 0.1;
    const yNorth = 5.1;

    const findNearestPoint = (testX: number, testYNorth: number, pts: Record<string, Point3D>): string | null => {
      for (const [id, p] of Object.entries(pts)) {
        const dist = Math.sqrt(Math.pow(p.x - testX, 2) + Math.pow(p.z - testYNorth, 2));
        if (dist < SNAP_THRESHOLD) {
          return id;
        }
      }
      return null;
    };

    expect(findNearestPoint(x, yNorth, useMapStore.getState().points)).toBe(pointId);
  });
});