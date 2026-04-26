import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useMapStore } from '../../store/mapStore';
import { useEditorStore } from '../../store/editorStore';
import { mapToThreeArray } from '../../utils/geometry/coordinates';

const LINESTRING_COLORS: Record<string, string> = {
  white: '#ffffff',
  yellow: '#ffcc00',
  line_thin: '#0066cc',
  line_thick: '#0066cc',
  curbstone: '#ff6b6b',
  virtual: '#888888',
  road_border: '#0066cc',
  guard_rail: '#888888',
  zebra_marking: '#ffffff',
  stop_line: '#ff0000',
  yield_line: '#ffff00',
  arrow: '#ffffff',
  traffic_sign: '#ff9500',
  traffic_light: '#ff0000',
};

export function PrimitiveLayer() {
  const { linestrings, lanelets, points } = useMapStore();
  const { selectedIds, hoveredId } = useEditorStore();

  const linestringData = useMemo(() => {
    return Object.values(linestrings).map((ls) => {
      const pts: [number, number, number][] = [];

      for (const ptId of ls.points) {
        const pt = points[ptId];
        if (pt) {
          pts.push(mapToThreeArray(pt));
        }
      }

      if (pts.length < 2) return null;

      const isSelected = selectedIds.includes(ls.id);
      const isHovered = hoveredId === ls.id;
      const color = LINESTRING_COLORS[ls.type] || LINESTRING_COLORS[ls.subtype] || '#ffffff';

      return {
        id: ls.id,
        points: pts,
        color,
        isSelected,
        isHovered,
        subtype: ls.subtype,
        type: ls.type,
      };
    }).filter(Boolean);
  }, [linestrings, points, selectedIds, hoveredId]);

  const laneletData = useMemo(() => {
    return Object.values(lanelets).map((lanelet) => {
      const leftLs = linestrings[lanelet.leftBound];
      const rightLs = linestrings[lanelet.rightBound];

      if (!leftLs || !rightLs) return null;

      const leftPoints = leftLs.points.map(id => points[id]).filter(Boolean);
      const rightPoints = rightLs.points.map(id => points[id]).filter(Boolean);

      if (leftPoints.length < 2 || rightPoints.length < 2) return null;

      const leftCoords: [number, number, number][] = leftPoints.map(pt => mapToThreeArray(pt));
      const rightCoords: [number, number, number][] = rightPoints.map(pt => mapToThreeArray(pt));

      const isSelected = selectedIds.includes(lanelet.id);
      const isHovered = hoveredId === lanelet.id;

      const centerPoints: [number, number, number][] = [];
      for (let i = 0; i < leftPoints.length; i++) {
        const l = leftCoords[i];
        const r = rightCoords[i] || rightCoords[rightCoords.length - 1];
        centerPoints.push([
          (l[0] + r[0]) / 2,
          (l[1] + r[1]) / 2 + 1.0,
          (l[2] + r[2]) / 2,
        ]);
      }

      return {
        id: lanelet.id,
        leftCoords,
        rightCoords,
        centerPoints,
        isSelected,
        isHovered,
        subtype: lanelet.subtype,
        oneWay: lanelet.oneWay,
      };
    }).filter(Boolean);
  }, [lanelets, linestrings, points, selectedIds, hoveredId]);

  const pointData = useMemo(() => {
    return Object.values(points).map(pt => ({
      id: pt.id,
      position: mapToThreeArray(pt),
      isSelected: selectedIds.includes(pt.id),
      isHovered: hoveredId === pt.id,
    }));
  }, [points, selectedIds, hoveredId]);

  return (
    <group>
      {linestringData.map((ls) => ls && (
        <LinestringComponent key={ls.id} {...ls} />
      ))}

      {laneletData.map((mesh) => mesh && (
        <LaneletBoundary key={mesh.id} {...mesh} />
      ))}

      {pointData.map((pt) => (
        <PointMesh key={pt.id} {...pt} />
      ))}
    </group>
  );
}

interface LinestringProps {
  id: string;
  points: [number, number, number][];
  color: string;
  isSelected: boolean;
  isHovered: boolean;
  subtype: string;
  type: string;
}

function LinestringComponent({
  id,
  points,
  color,
  isSelected,
  isHovered,
  subtype,
  type,
}: LinestringProps) {
  const setSelectedIds = useEditorStore((state) => state.setSelectedIds);
  const setHoveredId = useEditorStore((state) => state.setHoveredId);

  const finalColor = isSelected
    ? '#00d4ff'
    : isHovered
    ? '#ffcc00'
    : color;

  if (points.length < 2) return null;

  const isDashed = subtype === 'dashed' || subtype === 'dotted' || type === 'dashed' || type === 'dotted';
  const isDouble = subtype === 'double' || type === 'double';

  const lineWidth = isSelected || isHovered ? 3 : 2;

  const renderSingleLine = () => (
    <Line
      points={points}
      color={finalColor}
      lineWidth={lineWidth}
      dashed={isDashed}
      dashSize={1}
      gapSize={0.5}
      transparent={type === 'virtual'}
      opacity={type === 'virtual' ? 0.5 : 1}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedIds([id]);
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHoveredId(id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={() => {
        setHoveredId(null);
        document.body.style.cursor = 'auto';
      }}
    />
  );

  const renderDoubleLine = () => {
    const offset = 0.3;
    const leftPoints: [number, number, number][] = [];
    const rightPoints: [number, number, number][] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const dx = p1[0] - p0[0];
      const dz = p1[2] - p0[2];
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len === 0) continue;
      const nx = -dz / len * offset;
      const nz = dx / len * offset;

      if (i === 0) {
        leftPoints.push([p0[0] + nx, p0[1], p0[2] + nz]);
        rightPoints.push([p0[0] - nx, p0[1], p0[2] - nz]);
      }
      leftPoints.push([p1[0] + nx, p1[1], p1[2] + nz]);
      rightPoints.push([p1[0] - nx, p1[1], p1[2] - nz]);
    }

    return (
      <>
        <Line points={leftPoints} color={finalColor} lineWidth={lineWidth} />
        <Line points={rightPoints} color={finalColor} lineWidth={lineWidth} />
      </>
    );
  };

  return (
    <group>
      {isDouble ? renderDoubleLine() : renderSingleLine()}
    </group>
  );
}

interface LaneletBoundaryProps {
  id: string;
  leftCoords: [number, number, number][];
  rightCoords: [number, number, number][];
  centerPoints: [number, number, number][];
  isSelected: boolean;
  isHovered: boolean;
  subtype: string;
  oneWay: boolean;
}

function LaneletBoundary({ id, leftCoords, rightCoords, centerPoints, isSelected, isHovered, subtype, oneWay }: LaneletBoundaryProps) {
  const setSelectedIds = useEditorStore((state) => state.setSelectedIds);
  const setHoveredId = useEditorStore((state) => state.setHoveredId);

  const boundaryColor = isSelected
    ? '#00d4ff'
    : isHovered
    ? '#ffcc00'
    : '#666666';

  const fillColor = isSelected
    ? '#00d4ff'
    : isHovered
    ? '#ffcc00'
    : '#555555';

  if (leftCoords.length < 2 || rightCoords.length < 2) return null;

  const fillGeometry = useMemo(() => {
    const leftCopy = [...leftCoords];
    const rightReversed = [...rightCoords].reverse();
    const allPoints: [number, number, number][] = [...leftCopy, ...rightReversed];
    if (allPoints.length < 3) return null;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(allPoints.length * 3);
    const indices: number[] = [];

    for (let i = 0; i < allPoints.length; i++) {
      const p = allPoints[i];
      positions[i * 3 + 0] = p[0];
      positions[i * 3 + 1] = p[1];
      positions[i * 3 + 2] = p[2];
    }

    for (let i = 1; i < allPoints.length - 1; i++) {
      indices.push(0, i, i + 1);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [leftCoords, rightCoords]);

  const arrowPositions = useMemo(() => {
    if (!oneWay || centerPoints.length < 2) return [];
    const arrows: { pos: [number, number, number]; dir: [number, number, number] }[] = [];

    if (centerPoints.length === 2) {
      const dir: [number, number, number] = [centerPoints[1][0] - centerPoints[0][0], 0, centerPoints[1][2] - centerPoints[0][2]];
      arrows.push({
        pos: [
          (centerPoints[0][0] + centerPoints[1][0]) / 2,
          (centerPoints[0][1] + centerPoints[1][1]) / 2,
          (centerPoints[0][2] + centerPoints[1][2]) / 2,
        ],
        dir,
      });
      return arrows;
    }

    const interval = Math.max(1, Math.floor(centerPoints.length / 5));
    for (let i = interval; i < centerPoints.length - interval; i += interval) {
      const p1 = centerPoints[i];
      const p2 = centerPoints[Math.min(i + interval, centerPoints.length - 1)];
      const dir: [number, number, number] = [p2[0] - p1[0], 0, p2[2] - p1[2]];
      arrows.push({
        pos: p1,
        dir,
      });
    }
    return arrows;
  }, [centerPoints, oneWay]);

  return (
    <group>
      {fillGeometry && (
        <mesh
          geometry={fillGeometry}
          renderOrder={0}
          onClick={(e) => {
            e.stopPropagation();
            console.log('[LaneletBoundary] clicked, id:', id);
            setSelectedIds([id]);
          }}
          onPointerEnter={(e) => {
            e.stopPropagation();
            setHoveredId(id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerLeave={() => {
            setHoveredId(null);
            document.body.style.cursor = 'auto';
          }}
        >
          <meshBasicMaterial
            color={fillColor}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      <Line
        points={leftCoords}
        color={boundaryColor}
        lineWidth={isSelected || isHovered ? 2 : 1.5}
      />
      <Line
        points={[...rightCoords].reverse()}
        color={boundaryColor}
        lineWidth={isSelected || isHovered ? 2 : 1.5}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedIds([id]);
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHoveredId(id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHoveredId(null);
          document.body.style.cursor = 'auto';
        }}
      />
      {oneWay && arrowPositions.map((arrow, idx) => (
        <ArrowIndicator key={idx} position={arrow.pos} direction={arrow.dir} />
      ))}
    </group>
  );
}

function ArrowIndicator({ position, direction }: { position: [number, number, number]; direction: [number, number, number] }) {
  const dirLength = Math.sqrt(direction[0] ** 2 + direction[2] ** 2);
  if (dirLength < 0.1) return null;

  const dirX = direction[0] / dirLength;
  const dirZ = direction[2] / dirLength;

  const arrowLen = 2.0;
  const headLen = 0.6;
  const headWidth = 0.5;

  const tipX = position[0] + dirX * arrowLen;
  const tipZ = position[2] + dirZ * arrowLen;

  const shaftEndX = tipX - dirX * headLen;
  const shaftEndZ = tipZ - dirZ * headLen;

  const baseX = position[0];
  const baseZ = position[2];

  const perpX = dirZ;
  const perpZ = -dirX;

  const leftX = shaftEndX + perpX * headWidth;
  const leftZ = shaftEndZ + perpZ * headWidth;

  const rightX = shaftEndX - perpX * headWidth;
  const rightZ = shaftEndZ - perpZ * headWidth;

  return (
    <group>
      <Line
        points={[
          [baseX, position[1], baseZ],
          [shaftEndX, position[1], shaftEndZ],
          [leftX, position[1], leftZ],
          [tipX, position[1], tipZ],
          [rightX, position[1], rightZ],
          [shaftEndX, position[1], shaftEndZ],
        ]}
        color="#ffffff"
        lineWidth={3}
      />
    </group>
  );
}

interface PointMeshProps {
  id: string;
  position: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
}

function PointMesh({ id, position, isSelected, isHovered }: PointMeshProps) {
  const setSelectedIds = useEditorStore((state) => state.setSelectedIds);
  const setHoveredId = useEditorStore((state) => state.setHoveredId);
  const activeTool = useEditorStore((state) => state.activeTool);
  const snapIndicatorId = useEditorStore((state) => state.snapIndicatorId);
  const isSnapTarget = snapIndicatorId === id;

  return (
    <mesh
      position={position}
      onClick={(e) => {
        if (activeTool === 'select') {
          e.stopPropagation();
          setSelectedIds([id]);
        }
      }}
      onPointerEnter={() => {
        setHoveredId(id);
        document.body.style.cursor = activeTool === 'select' ? 'pointer' : 'crosshair';
      }}
      onPointerLeave={() => {
        setHoveredId(null);
        document.body.style.cursor = 'auto';
      }}
      visible={isSelected || isHovered || isSnapTarget}
    >
      <sphereGeometry args={[isSnapTarget ? 1.0 : 0.5, 16, 16]} />
      <meshBasicMaterial
        color={
          isSelected
            ? '#00d4ff'
            : isSnapTarget
            ? '#ff00ff'
            : isHovered
            ? '#ffcc00'
            : '#ff6b6b'
        }
      />
    </mesh>
  );
}
