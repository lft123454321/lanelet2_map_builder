import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PointCloudLayerProps {
  positions: Float32Array;
  colors: Float32Array;
}

export function PointCloudLayer({ positions, colors }: PointCloudLayerProps) {

  const transformedData = useMemo(() => {
    const count = positions.length / 3;
    const newPositions = new Float32Array(positions.length);

    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      newPositions[i * 3] = x;
      newPositions[i * 3 + 1] = z;
      newPositions[i * 3 + 2] = -y;
    }

    return newPositions;
  }, [positions]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(transformedData, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors.slice(), 3));
    return geo;
  }, [transformedData, colors]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
  }, []);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return <points geometry={geometry} material={material} />;
}
