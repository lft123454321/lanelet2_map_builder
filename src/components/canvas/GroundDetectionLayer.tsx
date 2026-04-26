import React, { useMemo } from 'react';
import * as THREE from 'three';
import { usePCDStore } from '../../store/pcdStore';

export function GroundDetectionLayer() {
  const { groundDetection, showGroundDetection } = usePCDStore();

  const geometry = useMemo(() => {
    if (!groundDetection || !showGroundDetection || groundDetection.groundPoints.length === 0) return null;

    const points = groundDetection.groundPoints;
    if (points.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }

    const resolution = 1.0;
    const gridW = Math.ceil((maxX - minX) / resolution) + 1;
    const gridH = Math.ceil((maxY - minY) / resolution) + 1;

    const grid: boolean[][] = Array(Math.ceil((maxY - minY) / resolution) + 1)
      .fill(null)
      .map(() => Array(Math.ceil((maxX - minX) / resolution) + 1).fill(false));

    for (const p of points) {
      const gx = Math.floor((p.x - minX) / resolution);
      const gy = Math.floor((p.y - minY) / resolution);
      if (gx >= 0 && gx < grid[0].length && gy >= 0 && gy < grid.length) {
        grid[gy][gx] = true;
      }
    }

    const positions: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    let vertexIndex = 0;

    for (let gy = 0; gy < grid.length - 1; gy++) {
      for (let gx = 0; gx < grid[0].length - 1; gx++) {
        const isGround = grid[gy] && grid[gy][gx];
        const isGroundRight = grid[gy] && grid[gy][gx + 1];
        const isGroundBottom = grid[gy + 1] && grid[gy + 1][gx];
        const isGroundBottomRight = grid[gy + 1] && grid[gy + 1][gx + 1];

        if (isGround && isGroundRight && isGroundBottom && isGroundBottomRight) {
          const x0 = minX + gx * resolution;
          const y0 = minY + gy * resolution;
          const x1 = x0 + resolution;
          const y1 = y0 + resolution;

          positions.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0);

          const avgZ = (points.find(p =>
            Math.floor((p.x - minX) / resolution) === gx &&
            Math.floor((p.y - minY) / resolution) === gy
          )?.z || 0);

          const t = Math.max(0, Math.min(1, (avgZ + 2) / 5));
          const r = 0.4 + t * 0.2;
          const g = 0.35 + t * 0.3;
          const b = 0.2 + t * 0.2;

          for (let v = 0; v < 4; v++) {
            colors.push(r, g, b);
          }

          indices.push(
            vertexIndex, vertexIndex + 1, vertexIndex + 2,
            vertexIndex, vertexIndex + 2, vertexIndex + 3
          );
          vertexIndex += 4;
        }
      }
    }

    if (positions.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [groundDetection, showGroundDetection]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={-1}>
      <meshBasicMaterial vertexColors transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}