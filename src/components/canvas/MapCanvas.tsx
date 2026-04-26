import React, { useCallback, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PointCloudLayer } from './PointCloudLayer';
import { PrimitiveLayer } from './PrimitiveLayer';
import { GroundDetectionLayer } from './GroundDetectionLayer';
import { usePCDStore } from '../../store/pcdStore';
import { useEditorStore } from '../../store/editorStore';
import { useMapStore } from '../../store/mapStore';
import { useToastStore, TOOL_HINTS, LANELET_STEPS } from '../../store/toastStore';
import { getGroundHeightSmooth } from '../../utils/geometry';
import { mapToThree } from '../../utils/geometry/coordinates';

const SNAP_THRESHOLD_PX = 15;

function worldToPixel(worldPoint: THREE.Vector3, camera: THREE.Camera, viewport: { width: number; height: number }): { x: number; y: number } {
  const ndc = worldPoint.clone().project(camera);
  return {
    x: (ndc.x + 1) / 2 * viewport.width,
    y: (-ndc.y + 1) / 2 * viewport.height,
  };
}

function findNearestPointPx(
  clickWorld: THREE.Vector3,
  points: Record<string, { x: number; y: number; z: number }>,
  camera: THREE.Camera,
  viewport: { width: number; height: number }
): string | null {
  const clickPixel = worldToPixel(clickWorld, camera, viewport);
  let nearestId: string | null = null;
  let nearestDist = Infinity;

  for (const [id, p] of Object.entries(points)) {
    const pt = mapToThree(p);
    const pointWorld = new THREE.Vector3(pt.x, pt.y, pt.z);
    const pointPixel = worldToPixel(pointWorld, camera, viewport);
    const dist = Math.sqrt(Math.pow(clickPixel.x - pointPixel.x, 2) + Math.pow(clickPixel.y - pointPixel.y, 2));
    if (dist < SNAP_THRESHOLD_PX) {
      console.log(`[findNearestPointPx] found ${id}, pixelDist=${dist.toFixed(1)}, clickPx=(${clickPixel.x.toFixed(0)}, ${clickPixel.y.toFixed(0)}), pointPx=(${pointPixel.x.toFixed(0)}, ${pointPixel.y.toFixed(0)})`);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = id;
      }
    }
  }
  return nearestId;
}

export function MapCanvas() {
  const { pointCloud, groundGrid } = usePCDStore();
  const { viewMode, activeTool, setViewMode } = useEditorStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { setActiveTool, selectedIds, setSelectedIds, isDrawing } = useEditorStore.getState();
    const { deletePrimitive } = useMapStore.getState();
    const { addToast } = useToastStore.getState();

    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'v':
        useEditorStore.getState().setSnapIndicatorId(null);
        setActiveTool('select');
        addToast({ message: TOOL_HINTS.select.激活, type: 'hint', duration: 2500 });
        break;
      case 'h':
        useEditorStore.getState().setSnapIndicatorId(null);
        setActiveTool('pan');
        addToast({ message: TOOL_HINTS.pan.激活, type: 'hint', duration: 2500 });
        break;
      case 'p':
        useEditorStore.getState().setSnapIndicatorId(null);
        setActiveTool('point');
        addToast({ message: TOOL_HINTS.point.激活, type: 'hint', duration: 2500 });
        break;
      case 'l':
        setActiveTool('linestring');
        addToast({ message: TOOL_HINTS.linestring.激活, type: 'hint', duration: 3000 });
        break;
      case 'a':
        setActiveTool('lanelet');
        addToast({ message: TOOL_HINTS.lanelet.激活, type: 'hint', duration: 3000 });
        break;
      case 'g':
        useEditorStore.getState().setSnapIndicatorId(null);
        setActiveTool('area');
        addToast({ message: TOOL_HINTS.area.激活, type: 'hint', duration: 2500 });
        break;
      case 'r':
        useEditorStore.getState().setSnapIndicatorId(null);
        setActiveTool('regulatory');
        addToast({ message: TOOL_HINTS.regulatory.激活, type: 'hint', duration: 2500 });
        break;
      case '2':
        setViewMode('2d');
        addToast({ message: '切换到 2D 视图', type: 'hint', duration: 1500 });
        break;
      case '3':
        setViewMode('3d');
        addToast({ message: '切换到 3D 视图', type: 'hint', duration: 1500 });
        break;
      case 'd':
      case 'delete':
      case 'backspace':
        if (selectedIds.length > 0) {
          for (const id of selectedIds) {
            deletePrimitive(id);
          }
          setSelectedIds([]);
          addToast({ message: `已删除 ${selectedIds.length} 个图元`, type: 'info', duration: 2000 });
        }
        break;
      case 'escape':
        if (isDrawing) {
          useEditorStore.setState({ isDrawing: false, drawingPoints: [], laneletLeftBoundId: null });
          addToast({ message: '已取消当前绘制', type: 'warning', duration: 2000 });
        }
        setSelectedIds([]);
        break;
      case 'enter':
        if (useEditorStore.getState().isDrawing && useEditorStore.getState().drawingPoints.length >= 2) {
          const { drawingPoints, setIsDrawing, setSelectedIds, activeTool, laneletLeftBoundId, setLaneletLeftBoundId } = useEditorStore.getState();
          const { addLinestring, addLanelet } = useMapStore.getState();
          const newLs = addLinestring(drawingPoints, 'line_thin', 'solid');

          if (activeTool === 'lanelet' && laneletLeftBoundId) {
            const laneletId = addLanelet(laneletLeftBoundId, newLs, 'road', { type: 'lanelet' });
            setSelectedIds([laneletId]);
            setLaneletLeftBoundId(null);
            addToast({ message: LANELET_STEPS.右边界完成, type: 'success', duration: 4000 });
          } else {
            setSelectedIds([newLs]);
            addToast({ message: `线串已创建 (${newLs})`, type: 'success', duration: 3000 });
          }
          setIsDrawing(false);
          useEditorStore.setState({ drawingPoints: [] });
        }
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
        style={{ background: '#f5f5f7', touchAction: 'none' }}
        frameloop="always"
      >
        {viewMode === '2d' ? (
          <OrthographicCamera
            makeDefault
            position={[0, 50, 0]}
            zoom={20}
            near={0.1}
            far={2000}
          />
        ) : (
          <PerspectiveCamera
            makeDefault
            position={[100, 100, 100]}
            fov={55}
            near={0.1}
            far={2000}
          />
        )}

        <OrbitControls
          makeDefault
          enableRotate={viewMode === '3d'}
          enablePan={true}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.05}
          mouseButtons={{
            LEFT: viewMode === '2d' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          target={[0, 0, 0]}
        />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />

        <Grid />

        {pointCloud && (
          <PointCloudLayer
            positions={pointCloud.positions}
            colors={pointCloud.colors}
          />
        )}

        <PrimitiveLayer />

        <GroundDetectionLayer />

        {(activeTool === 'point' || activeTool === 'linestring' || activeTool === 'lanelet') && <ClickPlane />}

        <axesHelper args={[20]} position={[0, 0.5, 0]} />
      </Canvas>
    </div>
  );
}

function Grid() {
  return (
    <gridHelper
      args={[400, 80, '#d1d1d6', '#e5e5ea']}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

function ClickPlane() {
  const { addPoint, addLinestring, addLanelet, points } = useMapStore.getState();
  const { groundGrid } = usePCDStore.getState();
  const { isDrawing, addDrawingPoint, setIsDrawing, setSelectedIds, laneletLeftBoundId, setLaneletLeftBoundId, setSnapIndicatorId } = useEditorStore.getState();
  const { addToast } = useToastStore();
  const { camera, gl } = useThree();

  const getViewport = () => ({ width: gl.domElement.clientWidth, height: gl.domElement.clientHeight });

  const handlePointerMove = (event: any) => {
    if (!event.point) return;
    const { activeTool } = useEditorStore.getState();
    if (activeTool === 'linestring' || activeTool === 'lanelet') {
      const nearestId = findNearestPointPx(event.point, points, camera, getViewport());
      setSnapIndicatorId(nearestId);
    } else {
      setSnapIndicatorId(null);
    }
  };

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (!event.point) return;

    const { activeTool } = useEditorStore.getState();
    const x = event.point.x;
    const yNorth = -event.point.z;
    const worldY = groundGrid ? getGroundHeightSmooth(groundGrid, x, yNorth, 1) : 0;

    if (activeTool === 'point') {
      const pointId = addPoint(x, worldY, yNorth);
      setSelectedIds([pointId]);
      addToast({
        message: `点已创建 (${pointId})，可继续添加更多点`,
        type: 'success',
        duration: 2000,
      });
    } else if (activeTool === 'linestring') {
      const snappedPointId = findNearestPointPx(event.point, points, camera, getViewport());
      console.log('[ClickPlane] linestring click, isDrawing:', isDrawing, 'snappedPointId:', snappedPointId);
      if (snappedPointId) {
        console.log('[ClickPlane] using snapped point:', snappedPointId);
        addDrawingPoint(snappedPointId);
        if (!isDrawing) {
          setIsDrawing(true);
        }
        const currentPoints = useEditorStore.getState().drawingPoints;
        if (currentPoints.length >= 2) {
          const newLs = addLinestring(currentPoints, 'line_thin', 'solid');
          setSelectedIds([newLs]);
          setIsDrawing(false);
          useEditorStore.setState({ drawingPoints: [] });
          addToast({
            message: `线串已创建 (${newLs})，按 L 继续绘制更多`,
            type: 'success',
            duration: 3000,
          });
        } else {
          addToast({
            message: `已添加第 ${currentPoints.length} 个顶点，再添加 ${2 - currentPoints.length} 个点`,
            type: 'info',
            duration: 1500,
          });
        }
        return;
      }

      if (!isDrawing) {
        setIsDrawing(true);
        useEditorStore.setState({ drawingPoints: [] });
        addToast({
          message: '开始绘制线串，请继续点击添加顶点',
          type: 'info',
          duration: 2000,
        });
      }

      const pointId = addPoint(x, worldY, yNorth);
      addDrawingPoint(pointId);

      const currentPoints = useEditorStore.getState().drawingPoints;

      if (currentPoints.length >= 2) {
        const newLs = addLinestring(currentPoints, 'line_thin', 'solid');
        setSelectedIds([newLs]);
        setIsDrawing(false);
        useEditorStore.setState({ drawingPoints: [] });
        addToast({
          message: `线串已创建 (${newLs})，按 L 继续绘制更多`,
          type: 'success',
          duration: 3000,
        });
      } else {
        addToast({
          message: `已添加第 ${currentPoints.length} 个顶点，再添加 ${2 - currentPoints.length} 个点`,
          type: 'info',
          duration: 1500,
        });
      }
    } else if (activeTool === 'lanelet') {
      const snappedPointId = findNearestPointPx(event.point, points, camera, getViewport());
      console.log('[ClickPlane] lanelet click, isDrawing:', isDrawing, 'snappedPointId:', snappedPointId);
      if (snappedPointId) {
        console.log('[ClickPlane] using snapped point:', snappedPointId);
        addDrawingPoint(snappedPointId);
        if (!isDrawing) {
          setIsDrawing(true);
        }
        const currentPoints = useEditorStore.getState().drawingPoints;
        if (currentPoints.length >= 2) {
          const newLs = addLinestring(currentPoints, 'line_thin', 'solid');
          if (!laneletLeftBoundId) {
            setLaneletLeftBoundId(newLs);
            setSelectedIds([newLs]);
            setIsDrawing(false);
            useEditorStore.setState({ drawingPoints: [] });
            addToast({
              message: LANELET_STEPS.左边界完成,
              type: 'success',
              duration: 3000,
            });
          } else {
            const laneletId = addLanelet(laneletLeftBoundId, newLs, 'road', { type: 'lanelet' });
            setSelectedIds([laneletId]);
            setIsDrawing(false);
            useEditorStore.setState({ drawingPoints: [] });
            setLaneletLeftBoundId(null);
            addToast({
              message: LANELET_STEPS.右边界完成,
              type: 'success',
              duration: 4000,
            });
          }
        }
        return;
      }

      if (!isDrawing) {
        setIsDrawing(true);
        useEditorStore.setState({ drawingPoints: [] });
        addToast({
          message: LANELET_STEPS.等待绘制左边界,
          type: 'info',
          duration: 3000,
        });
      }

      const pointId = addPoint(x, worldY, yNorth);
      console.log('[ClickPlane] created new point:', pointId, 'at', x, worldY, yNorth);
      addDrawingPoint(pointId);

      const currentPoints = useEditorStore.getState().drawingPoints;

      if (currentPoints.length >= 2) {
        const newLs = addLinestring(currentPoints, 'line_thin', 'solid');

        if (!laneletLeftBoundId) {
          setLaneletLeftBoundId(newLs);
          setSelectedIds([newLs]);
          setIsDrawing(false);
          useEditorStore.setState({ drawingPoints: [] });
          addToast({
            message: LANELET_STEPS.左边界完成,
            type: 'success',
            duration: 3000,
          });
        } else {
          const laneletId = addLanelet(laneletLeftBoundId, newLs, 'road', { type: 'lanelet' });
          setSelectedIds([laneletId]);
          setIsDrawing(false);
          useEditorStore.setState({ drawingPoints: [] });
          setLaneletLeftBoundId(null);
          addToast({
            message: LANELET_STEPS.右边界完成,
            type: 'success',
            duration: 4000,
          });
        }
      } else {
        const hint = !laneletLeftBoundId
          ? `左边界已添加 ${currentPoints.length} 个点，还需要 ${2 - currentPoints.length} 个`
          : `右边界已添加 ${currentPoints.length} 个点，还需要 ${2 - currentPoints.length} 个`;
        addToast({
          message: hint,
          type: 'info',
          duration: 1500,
        });
      }
    }
    setSnapIndicatorId(null);
  };

  return (
    <mesh
      renderOrder={999}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.1, 0]}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
    >
      <planeGeometry args={[2000, 2000]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}


