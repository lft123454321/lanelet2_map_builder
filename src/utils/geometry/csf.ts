export interface CSFPoint {
  x: number;
  y: number;
  z: number;
}

export interface CSFConfig {
  clothResolution: number;
  clothZOffset: number;
  gravity: number;
  timeStep: number;
  iterations: number;
  rigidity: number;
  slopeThreshold: number;
}

export interface GroundDetectionResult {
  groundPoints: CSFPoint[];
  nonGroundPoints: CSFPoint[];
  clothParticles: CSFPoint[];
  slopeMap: number[][];
}

function createCloth(
  width: number,
  height: number,
  resolution: number,
  zOffset: number
): CSFPoint[][] {
  const cloth: CSFPoint[][] = [];
  const rows = Math.ceil(height / resolution);
  const cols = Math.ceil(width / resolution);

  for (let i = 0; i < rows; i++) {
    cloth[i] = [];
    for (let j = 0; j < cols; j++) {
      cloth[i][j] = {
        x: j * resolution,
        y: i * resolution,
        z: zOffset,
      };
    }
  }
  return cloth;
}

function moveClothParticle(
  cloth: CSFPoint[][],
  i: number,
  j: number,
  points: CSFPoint[],
  config: CSFConfig,
  width: number,
  height: number
): void {
  const particle = cloth[i][j];
  const gridX = Math.floor(particle.x / config.clothResolution);
  const gridY = Math.floor(particle.y / config.clothResolution);

  let minDist = Infinity;
  let closestPoint: CSFPoint | null = null;

  for (const point of points) {
    const dx = point.x - particle.x;
    const dy = point.y - particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {
      minDist = dist;
      closestPoint = point;
    }
  }

  if (closestPoint && minDist < config.clothResolution * 2) {
    const dropAmount = (particle.z - closestPoint.z) * config.gravity * config.timeStep;
    particle.z = Math.max(particle.z - dropAmount, closestPoint.z);
  }
}

function applyClothConstraints(cloth: CSFPoint[][], config: CSFConfig): void {
  const rows = cloth.length;
  const cols = cloth[0].length;
  const restLength = config.clothResolution;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const particle = cloth[i][j];

      if (j < cols - 1) {
        const right = cloth[i][j + 1];
        const dx = right.x - particle.x;
        const dy = right.y - particle.y;
        const dz = right.z - particle.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0) {
          const diff = (dist - restLength) / dist * config.rigidity;
          particle.x += dx * diff * 0.5;
          particle.y += dy * diff * 0.5;
          particle.z += dz * diff * 0.5;
          right.x -= dx * diff * 0.5;
          right.y -= dy * diff * 0.5;
          right.z -= dz * diff * 0.5;
        }
      }

      if (i < rows - 1) {
        const down = cloth[i + 1][j];
        const dx = down.x - particle.x;
        const dy = down.y - particle.y;
        const dz = down.z - particle.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0) {
          const diff = (dist - restLength) / dist * config.rigidity;
          particle.x += dx * diff * 0.5;
          particle.y += dy * diff * 0.5;
          particle.z += dz * diff * 0.5;
          down.x -= dx * diff * 0.5;
          down.y -= dy * diff * 0.5;
          down.z -= dz * diff * 0.5;
        }
      }
    }
  }
}

function computeSlopeMap(
  cloth: CSFPoint[][],
  threshold: number
): { slopeMap: number[][]; groundParticles: CSFPoint[] } {
  const rows = cloth.length;
  const cols = cloth[0].length;
  const slopeMap: number[][] = [];
  const groundParticles: CSFPoint[] = [];

  const maxSlopeRad = Math.atan(threshold);

  for (let i = 0; i < rows; i++) {
    slopeMap[i] = [];
    for (let j = 0; j < cols; j++) {
      const particle = cloth[i][j];

      let maxSlope = 0;
      const neighbors: CSFPoint[] = [];

      if (i > 0) neighbors.push(cloth[i - 1][j]);
      if (i < rows - 1) neighbors.push(cloth[i + 1][j]);
      if (j > 0) neighbors.push(cloth[i][j - 1]);
      if (j < cols - 1) neighbors.push(cloth[i][j + 1]);

      for (const neighbor of neighbors) {
        const dx = neighbor.x - particle.x;
        const dy = neighbor.y - particle.y;
        const dz = neighbor.z - particle.z;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const slope = Math.abs(dz) / dist;
          maxSlope = Math.max(maxSlope, slope);
        }
      }

      slopeMap[i][j] = maxSlope;
      if (maxSlope <= maxSlopeRad) {
        groundParticles.push({ ...particle });
      }
    }
  }

  return { slopeMap, groundParticles };
}

export function detectGroundCSF(
  points: CSFPoint[],
  config: CSFConfig
): GroundDetectionResult {
  console.time('[CSF] total');

  if (points.length === 0) {
    return {
      groundPoints: [],
      nonGroundPoints: [],
      clothParticles: [],
      slopeMap: [],
    };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z);
  }

  const width = maxX - minX;
  const height = maxY - minY;

  console.time('[CSF] create cloth');
  const cloth = createCloth(width, height, config.clothResolution, minZ + config.clothZOffset);
  console.timeEnd('[CSF] create cloth');

  const normalizedPoints = points.map(p => ({
    x: p.x - minX,
    y: p.y - minY,
    z: p.z,
  }));

  console.time('[CSF] simulation');
  for (let iter = 0; iter < config.iterations; iter++) {
    for (let i = 0; i < cloth.length; i++) {
      for (let j = 0; j < cloth[i].length; j++) {
        moveClothParticle(cloth, i, j, normalizedPoints, config, width, height);
      }
    }
    applyClothConstraints(cloth, config);
  }
  console.timeEnd('[CSF] simulation');

  console.time('[CSF] slope computation');
  const { slopeMap, groundParticles } = computeSlopeMap(cloth, config.slopeThreshold);
  console.timeEnd('[CSF] slope computation');

  const clothParticles: CSFPoint[] = [];
  for (const row of cloth) {
    for (const p of row) {
      clothParticles.push({
        x: p.x + minX,
        y: p.y + minY,
        z: p.z,
      });
    }
  }

  const groundPoints = groundParticles.map(p => ({
    x: p.x + minX,
    y: p.y + minY,
    z: p.z,
  }));

  const thresholdDist = config.clothResolution * 1.5;
  const groundSet = new Set<string>();
  for (const gp of groundPoints) {
    groundSet.add(`${gp.x.toFixed(3)},${gp.y.toFixed(3)},${gp.z.toFixed(3)}`);
  }

  const nonGroundPoints: CSFPoint[] = [];
  for (const p of points) {
    let minDistToGround = Infinity;
    for (const gp of groundPoints) {
      const dx = p.x - gp.x;
      const dy = p.y - gp.y;
      const dz = p.z - gp.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      minDistToGround = Math.min(minDistToGround, dist);
    }
    if (minDistToGround > thresholdDist) {
      nonGroundPoints.push(p);
    }
  }

  console.timeEnd('[CSF] total');

  return {
    groundPoints,
    nonGroundPoints,
    clothParticles,
    slopeMap,
  };
}

export function detectGroundByHeight(
  points: CSFPoint[],
  resolution: number = 0.5,
  heightThreshold: number = 0.3
): { groundPoints: CSFPoint[]; grid: number[][] } {
  if (points.length === 0) {
    return { groundPoints: [], grid: [] };
  }

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

  const width = Math.ceil((maxX - minX) / resolution);
  const height = Math.ceil((maxY - minY) / resolution);
  const grid: number[][] = Array(height).fill(null).map(() => Array(width).fill(Infinity));

  for (const p of points) {
    const gx = Math.floor((p.x - minX) / resolution);
    const gy = Math.floor((p.y - minY) / resolution);
    if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
      grid[gy][gx] = Math.min(grid[gy][gx], p.z);
    }
  }

  const groundPoints: CSFPoint[] = [];
  const slopeThreshold = 0.2;
  const maxSlopeRad = Math.atan(slopeThreshold);

  for (let gy = 0; gy < height; gy++) {
    for (let gx = 0; gx < width; gx++) {
      if (grid[gy][gx] === Infinity) continue;

      let maxSlope = 0;
      const neighbors = [
        [gx - 1, gy], [gx + 1, gy],
        [gx, gy - 1], [gx, gy + 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx] !== Infinity) {
          const dz = Math.abs(grid[gy][gx] - grid[ny][nx]);
          const dist = resolution;
          const slope = dz / dist;
          maxSlope = Math.max(maxSlope, slope);
        }
      }

      if (maxSlope <= maxSlopeRad) {
        groundPoints.push({
          x: minX + gx * resolution + resolution / 2,
          y: minY + gy * resolution + resolution / 2,
          z: grid[gy][gx],
        });
      }
    }
  }

  return { groundPoints, grid };
}

export const defaultCSFConfig: CSFConfig = {
  clothResolution: 1.0,
  clothZOffset: 3.0,
  gravity: 9.8,
  timeStep: 0.01,
  iterations: 100,
  rigidity: 0.3,
  slopeThreshold: 0.2,
};