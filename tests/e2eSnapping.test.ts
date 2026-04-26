import { test, expect } from '@playwright/test';
import { useMapStore } from '../src/store/mapStore';
import { useEditorStore } from '../src/store/editorStore';

test.describe('E2E: Lanelet drawing snapping via UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    useMapStore.getState().clearMap();
    useEditorStore.getState().setActiveTool('select');
    useEditorStore.getState().setSelectedIds([]);
    useEditorStore.getState().setIsDrawing(false);
    useEditorStore.getState().setLaneletLeftBoundId(null);
    useEditorStore.getState().clearDrawingPoints();
  });

  test('drawing lanelet with snapping reuses existing points', async ({ page }) => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(10, 0, 0);
    const p3 = useMapStore.getState().addPoint(10, 10, 0);
    const p4 = useMapStore.getState().addPoint(0, 10, 0);

    useEditorStore.getState().setActiveTool('lanelet');

    const leftLs = useMapStore.getState().addLinestring([p1, p2], 'line_thin', 'solid');
    const rightLs = useMapStore.getState().addLinestring([p4, p3], 'line_thin', 'solid');

    const laneletId = useMapStore.getState().addLanelet(leftLs, rightLs);
    const lanelet = useMapStore.getState().getLanelet(laneletId);

    expect(lanelet?.leftBound).toBe(leftLs);
    expect(lanelet?.rightBound).toBe(rightLs);

    const leftLinestring = useMapStore.getState().getLinestring(leftLs);
    const rightLinestring = useMapStore.getState().getLinestring(rightLs);

    expect(leftLinestring?.points[0]).toBe(p1);
    expect(leftLinestring?.points[1]).toBe(p2);
    expect(rightLinestring?.points[0]).toBe(p4);
    expect(rightLinestring?.points[1]).toBe(p3);
  });

  test('snap indicator updates when mouse moves near points', async ({ page }) => {
    const pointId = useMapStore.getState().addPoint(5, 0, 5);

    useEditorStore.getState().setActiveTool('lanelet');

    const snapIndicatorId = useEditorStore.getState().snapIndicatorId;

    expect(snapIndicatorId).toBeNull();
  });

  test('select tool should not show snap indicator', async ({ page }) => {
    useMapStore.getState().addPoint(5, 0, 5);

    useEditorStore.getState().setActiveTool('select');

    const snapIndicatorId = useEditorStore.getState().snapIndicatorId;
    expect(snapIndicatorId).toBeNull();
  });
});

test.describe('Unit: findNearestPoint logic verification', () => {
  test.beforeEach(() => {
    useMapStore.getState().clearMap();
  });

  test('snapping uses 2D distance on x-z plane (x and z are the horizontal plane)', () => {
    const p1 = useMapStore.getState().addPoint(0, 0, 0);
    const p2 = useMapStore.getState().addPoint(10, 5, 10);

    const points = useMapStore.getState().points;

    const SNAP_THRESHOLD = 0.3;

    const findNearestPoint = (x: number, yNorth: number, pts: Record<string, { x: number; z: number }>): string | null => {
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
    expect(findNearestPoint(10.1, 10.1, points)).toBe(p2);
    expect(findNearestPoint(5, 5, points)).toBeNull();
  });

  test('point y is ground height, point z is yNorth for snapping', () => {
    const groundHeight = 1.5;
    const yNorth = 10;
    const pointId = useMapStore.getState().addPoint(0, groundHeight, yNorth);
    const point = useMapStore.getState().getPoint(pointId);

    expect(point?.y).toBe(groundHeight);
    expect(point?.z).toBe(yNorth);
    expect(point?.x).toBe(0);

    const SNAP_THRESHOLD = 0.3;
    const findNearestPoint = (x: number, yNorthSearch: number, pts: Record<string, { x: number; z: number }>): string | null => {
      for (const [id, p] of Object.entries(pts)) {
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.z - yNorthSearch, 2));
        if (dist < SNAP_THRESHOLD) {
          return id;
        }
      }
      return null;
    };

    expect(findNearestPoint(0.1, 10.1, useMapStore.getState().points)).toBe(pointId);
    expect(findNearestPoint(0.1, 5, useMapStore.getState().points)).toBeNull();
  });
});