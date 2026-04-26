const DAMPING = 0.01;
const MAX_INF = 9999999999;
const MIN_INF = -9999999999;

const singleMove1 = [0, 0.3, 0.51, 0.657, 0.7599, 0.83193, 0.88235, 0.91765, 0.94235, 0.95965, 0.97175, 0.98023, 0.98616, 0.99031, 0.99322];
const doubleMove1 = [0, 0.3, 0.42, 0.468, 0.4872, 0.4949, 0.498, 0.4992, 0.4997, 0.4999, 0.4999, 0.5, 0.5, 0.5, 0.5];

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Point {
  x: number;
  y: number;
  z: number;
}

interface Particle {
  pos: Vec3;
  oldPos: Vec3;
  movable: boolean;
  mass: number;
  acceleration: Vec3;
  accumulatedNormal: Vec3;
  timeStep2: number;
  isVisited: boolean;
  neiborCount: number;
  posX: number;
  posY: number;
  cPos: number;
  neighborsList: Particle[];
  correspondingLidarPointList: number[];
  nearestPointIndex: number;
  nearestPointHeight: number;
  tmpDist: number;
}

interface Cloth {
  particles: Particle[];
  originPos: Vec3;
  stepX: number;
  stepY: number;
  heightvals: number[];
  numParticlesWidth: number;
  numParticlesHeight: number;
  constraintIterations: number;
  rigidness: number;
  timeStep: number;
  smoothThreshold: number;
  heightThreshold: number;
}

interface CSFParams {
  clothResolution: number;
  rigidness: number;
  timeStep: number;
  classThreshold: number;
  iterations: number;
}

function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

function vecSub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecMul(a: Vec3, scalar: number): Vec3 {
  return { x: a.x * scalar, y: a.y * scalar, z: a.z * scalar };
}

function vecDot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vecLength(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vecNormalize(v: Vec3): Vec3 {
  const len = vecLength(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function createParticle(pos: Vec3, timeStep2: number): Particle {
  return {
    pos: { ...pos },
    oldPos: { ...pos },
    movable: true,
    mass: 1,
    acceleration: { x: 0, y: 0, z: 0 },
    accumulatedNormal: { x: 0, y: 0, z: 0 },
    timeStep2,
    isVisited: false,
    neiborCount: 0,
    posX: 0,
    posY: 0,
    cPos: 0,
    neighborsList: [],
    correspondingLidarPointList: [],
    nearestPointIndex: 0,
    nearestPointHeight: MIN_INF,
    tmpDist: MAX_INF,
  };
}

function particleTimeStep(p: Particle): void {
  if (!p.movable) return;

  const velX = (p.pos.x - p.oldPos.x) * (1.0 - DAMPING);
  const velY = (p.pos.y - p.oldPos.y) * (1.0 - DAMPING);
  const velZ = (p.pos.z - p.oldPos.z) * (1.0 - DAMPING);

  p.oldPos = { ...p.pos };

  p.pos.x = p.pos.x + velX + p.acceleration.x * p.timeStep2;
  p.pos.y = p.pos.y + velY + p.acceleration.y * p.timeStep2;
  p.pos.z = p.pos.z + velZ + p.acceleration.z * p.timeStep2;

  p.acceleration = { x: 0, y: 0, z: 0 };
}

function satisfyConstraintSelf(p1: Particle, constraintTimes: number): void {
  for (const p2 of p1.neighborsList) {
    const diffY = p2.pos.y - p1.pos.y;

    if (p1.movable && p2.movable) {
      const moveAmount = constraintTimes > 14 ? 0.5 : doubleMove1[constraintTimes];
      const offset = diffY * moveAmount;
      p1.pos.y += offset;
      p2.pos.y -= offset;
    } else if (p1.movable && !p2.movable) {
      const moveAmount = constraintTimes > 14 ? 1 : singleMove1[constraintTimes];
      p1.pos.y += diffY * moveAmount;
    } else if (!p1.movable && p2.movable) {
      const moveAmount = constraintTimes > 14 ? 1 : singleMove1[constraintTimes];
      p2.pos.y -= diffY * moveAmount;
    }
  }
}

function createCloth(
  originPos: Vec3,
  numParticlesWidth: number,
  numParticlesHeight: number,
  stepX: number,
  stepY: number,
  smoothThreshold: number,
  heightThreshold: number,
  rigidness: number,
  timeStep: number
): Cloth {
  const particles: Particle[] = [];
  const timeStep2 = timeStep * timeStep;

  for (let i = 0; i < numParticlesWidth; i++) {
    for (let j = 0; j < numParticlesHeight; j++) {
      const pos = vec3(
        originPos.x + i * stepX,
        originPos.y,
        originPos.z + j * stepY
      );
      const p = createParticle(pos, timeStep2);
      p.posX = i;
      p.posY = j;
      particles.push(p);
    }
  }

  for (let x = 0; x < numParticlesWidth; x++) {
    for (let y = 0; y < numParticlesHeight; y++) {
      const getParticle = (px: number, py: number): Particle => {
        return particles[py * numParticlesWidth + px];
      };

      if (x < numParticlesWidth - 1) {
        const p1 = getParticle(x, y);
        const p2 = getParticle(x + 1, y);
        p1.neighborsList.push(p2);
        p2.neighborsList.push(p1);
      }

      if (y < numParticlesHeight - 1) {
        const p1 = getParticle(x, y);
        const p2 = getParticle(x, y + 1);
        p1.neighborsList.push(p2);
        p2.neighborsList.push(p1);
      }

      if (x < numParticlesWidth - 1 && y < numParticlesHeight - 1) {
        const p1 = getParticle(x, y);
        const p2 = getParticle(x + 1, y + 1);
        p1.neighborsList.push(p2);
        p2.neighborsList.push(p1);

        const p3 = getParticle(x + 1, y);
        const p4 = getParticle(x, y + 1);
        p3.neighborsList.push(p4);
        p4.neighborsList.push(p3);
      }
    }
  }

  for (let x = 0; x < numParticlesWidth; x++) {
    for (let y = 0; y < numParticlesHeight; y++) {
      const getParticle = (px: number, py: number): Particle => {
        return particles[py * numParticlesWidth + px];
      };

      if (x < numParticlesWidth - 2) {
        const p1 = getParticle(x, y);
        const p2 = getParticle(x + 2, y);
        p1.neighborsList.push(p2);
        p2.neighborsList.push(p1);
      }

      if (y < numParticlesHeight - 2) {
        const p1 = getParticle(x, y);
        const p2 = getParticle(x, y + 2);
        p1.neighborsList.push(p2);
        p2.neighborsList.push(p1);
      }

      if (x < numParticlesWidth - 2 && y < numParticlesHeight - 2) {
        const p1 = getParticle(x, y);
        const p2 = getParticle(x + 2, y + 2);
        p1.neighborsList.push(p2);
        p2.neighborsList.push(p1);

        const p3 = getParticle(x + 2, y);
        const p4 = getParticle(x, y + 2);
        p3.neighborsList.push(p4);
        p4.neighborsList.push(p3);
      }
    }
  }

  return {
    particles,
    originPos,
    stepX,
    stepY,
    heightvals: [],
    numParticlesWidth,
    numParticlesHeight,
    constraintIterations: rigidness,
    rigidness,
    timeStep,
    smoothThreshold,
    heightThreshold,
  };
}

function clothTimeStep(cloth: Cloth): number {
  const particleCount = cloth.particles.length;

  for (let i = 0; i < particleCount; i++) {
    particleTimeStep(cloth.particles[i]);
  }

  for (let j = 0; j < particleCount; j++) {
    satisfyConstraintSelf(cloth.particles[j], cloth.constraintIterations);
  }

  let maxDiff = 0;
  for (let i = 0; i < particleCount; i++) {
    if (cloth.particles[i].movable) {
      const diff = Math.abs(cloth.particles[i].oldPos.y - cloth.particles[i].pos.y);
      if (diff > maxDiff) {
        maxDiff = diff;
      }
    }
  }

  return maxDiff;
}

function terrCollision(cloth: Cloth): void {
  const particleCount = cloth.particles.length;
  for (let i = 0; i < particleCount; i++) {
    const p = cloth.particles[i];
    if (p.pos.y < cloth.heightvals[i]) {
      p.pos.y = cloth.heightvals[i];
      p.movable = false;
    }
  }
}

function findHeightValByScanline(p: Particle, cloth: Cloth): number {
  const xpos = p.posX;
  const ypos = p.posY;

  for (let i = xpos + 1; i < cloth.numParticlesWidth; i++) {
    const h = cloth.particles[ypos * cloth.numParticlesWidth + i].nearestPointHeight;
    if (h > MIN_INF) return h;
  }

  for (let i = xpos - 1; i >= 0; i--) {
    const h = cloth.particles[ypos * cloth.numParticlesWidth + i].nearestPointHeight;
    if (h > MIN_INF) return h;
  }

  for (let j = ypos - 1; j >= 0; j--) {
    const h = cloth.particles[j * cloth.numParticlesWidth + xpos].nearestPointHeight;
    if (h > MIN_INF) return h;
  }

  for (let j = ypos + 1; j < cloth.numParticlesHeight; j++) {
    const h = cloth.particles[j * cloth.numParticlesWidth + xpos].nearestPointHeight;
    if (h > MIN_INF) return h;
  }

  return MIN_INF;
}

function rasterTerrain(cloth: Cloth, pointCloud: Vec3[]): void {
  for (let i = 0; i < pointCloud.length; i++) {
    const pc = pointCloud[i];
    const pcX = pc.x;
    const pcZ = pc.z;

    const deltaX = pcX - cloth.originPos.x;
    const deltaZ = pcZ - cloth.originPos.z;

    const col = Math.floor(deltaX / cloth.stepX + 0.5);
    const row = Math.floor(deltaZ / cloth.stepY + 0.5);

    if (col >= 0 && row >= 0 && col < cloth.numParticlesWidth && row < cloth.numParticlesHeight) {
      const pt = cloth.particles[row * cloth.numParticlesWidth + col];
      pt.correspondingLidarPointList.push(i);

      const distX = pcX - pt.pos.x;
      const distZ = pcZ - pt.pos.z;
      const dist = distX * distX + distZ * distZ;

      if (dist < pt.tmpDist) {
        pt.tmpDist = dist;
        pt.nearestPointHeight = pc.y;
        pt.nearestPointIndex = i;
      }
    }
  }

  cloth.heightvals = new Array(cloth.particles.length);

  for (let i = 0; i < cloth.particles.length; i++) {
    const pcur = cloth.particles[i];
    const nearestHeight = pcur.nearestPointHeight;

    if (nearestHeight > MIN_INF) {
      cloth.heightvals[i] = nearestHeight;
    } else {
      cloth.heightvals[i] = findHeightValByScanline(pcur, cloth);
    }
  }
}

function runCSF(
  pointCloud: Vec3[],
  params: CSFParams
): { groundHeights: number[]; groundPoints: Vec3[]; clothParticlePositions: Vec3[] } {
  let bbMinX = MAX_INF, bbMaxX = -MAX_INF;
  let bbMinZ = MAX_INF, bbMaxZ = -MAX_INF;
  let bbMaxY = -MAX_INF;

  for (const p of pointCloud) {
    if (p.x < bbMinX) bbMinX = p.x;
    if (p.x > bbMaxX) bbMaxX = p.x;
    if (p.z < bbMinZ) bbMinZ = p.z;
    if (p.z > bbMaxZ) bbMaxZ = p.z;
    if (p.y > bbMaxY) bbMaxY = p.y;
  }

  const clothYHeight = 0.05;
  const clothBuffer = 2;

  const originPos = vec3(
    bbMinX - clothBuffer * params.clothResolution,
    bbMaxY + clothYHeight,
    bbMinZ - clothBuffer * params.clothResolution
  );

  const widthNum = Math.floor((bbMaxX - bbMinX) / params.clothResolution) + 2 * clothBuffer;
  const heightNum = Math.floor((bbMaxZ - bbMinZ) / params.clothResolution) + 2 * clothBuffer;

  const cloth = createCloth(
    originPos,
    widthNum,
    heightNum,
    params.clothResolution,
    params.clothResolution,
    0.3,
    9999,
    params.rigidness,
    params.timeStep
  );

  rasterTerrain(cloth, pointCloud);

  const timeStep2 = params.timeStep * params.timeStep;
  const gravity = 0.2;
  const gravityVec = vecMul(vec3(0, -gravity, 0), timeStep2);

  for (let iter = 0; iter < params.iterations; iter++) {
    for (const p of cloth.particles) {
      p.acceleration = vecAdd(p.acceleration, gravityVec);
    }

    const maxDiff = clothTimeStep(cloth);
    terrCollision(cloth);

    if (maxDiff !== 0 && maxDiff < 0.005) {
      break;
    }
  }

  const groundHeights: number[] = [];
  const groundPoints: Vec3[] = [];
  const clothParticlePositions: Vec3[] = [];

  for (let i = 0; i < cloth.particles.length; i++) {
    const p = cloth.particles[i];
    clothParticlePositions.push({ x: p.pos.x, y: p.pos.z, z: p.pos.y });
    groundHeights.push(p.pos.y);
  }

  return { groundHeights, groundPoints, clothParticlePositions };
}

export interface GroundExtractionResult {
  groundHeights: Float32Array;
  gridWidth: number;
  gridHeight: number;
  originX: number;
  originY: number;
  resolution: number;
}

export interface CSFConfig {
  clothResolution: number;
  rigidness: number;
  timeStep: number;
  classThreshold: number;
  iterations: number;
}

const defaultCSFConfig: CSFConfig = {
  clothResolution: 0.5,
  rigidness: 3,
  timeStep: 0.65,
  classThreshold: 0.5,
  iterations: 500,
};

export function extractGroundWithCSF(
  positions: Float32Array,
  config: Partial<CSFConfig> = {}
): GroundExtractionResult {
  const cfg = { ...defaultCSFConfig, ...config };

  const pointCloud: Vec3[] = [];
  const count = positions.length / 3;

  for (let i = 0; i < count; i++) {
    pointCloud.push({
      x: positions[i * 3],
      y: positions[i * 3 + 1],
      z: positions[i * 3 + 2],
    });
  }

  const result = runCSF(pointCloud, cfg);

  let bbMinX = MAX_INF, bbMaxX = -MAX_INF;
  let bbMinY = MAX_INF, bbMaxY = -MAX_INF;

  for (let i = 0; i < count; i++) {
    if (pointCloud[i].x < bbMinX) bbMinX = pointCloud[i].x;
    if (pointCloud[i].x > bbMaxX) bbMaxX = pointCloud[i].x;
    if (pointCloud[i].y < bbMinY) bbMinY = pointCloud[i].y;
    if (pointCloud[i].y > bbMaxY) bbMaxY = pointCloud[i].y;
  }

  const clothBuffer = 2;
  const originX = bbMinX - clothBuffer * cfg.clothResolution;
  const originY = bbMinY - clothBuffer * cfg.clothResolution;

  const gridWidth = Math.floor((bbMaxX - bbMinX) / cfg.clothResolution) + 2 * clothBuffer;
  const gridHeight = Math.floor((bbMaxY - bbMinY) / cfg.clothResolution) + 2 * clothBuffer;

  return {
    groundHeights: new Float32Array(result.groundHeights),
    gridWidth,
    gridHeight,
    originX,
    originY,
    resolution: cfg.clothResolution,
  };
}
