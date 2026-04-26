export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ThreePoint {
  x: number;
  y: number;
  z: number;
}

export function mapToThree(p: Point3D): ThreePoint {
  return {
    x: p.x,
    y: p.y,
    z: -p.z,
  };
}

export function threeToMap(p: ThreePoint): Point3D {
  return {
    x: p.x,
    y: p.y,
    z: -p.z,
  };
}

export function mapToThreeArray(p: Point3D): [number, number, number] {
  return [p.x, p.y, -p.z];
}

export function threeToMapArray(p: ThreePoint): [number, number, number] {
  return [p.x, p.y, -p.z];
}
