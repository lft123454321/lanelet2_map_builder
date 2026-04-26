import type { GroundGrid, GroundExtractionConfig, ProcessedPointCloud } from '../../types';

export function extractGroundGrid(
  pointCloud: ProcessedPointCloud,
  config: GroundExtractionConfig
): GroundGrid {
  console.time('[extractGroundGrid] total');
  const resolution = config.gridResolution;
  const { positions, boundingBox } = pointCloud;

  const originX = Math.floor(boundingBox.min[0] / resolution) * resolution;
  const originY = Math.floor(boundingBox.min[1] / resolution) * resolution;

  const maxX = Math.ceil(boundingBox.max[0] / resolution) * resolution;
  const maxY = Math.ceil(boundingBox.max[1] / resolution) * resolution;

  const width = Math.ceil((maxX - originX) / resolution) + 1;
  const height = Math.ceil((maxY - originY) / resolution) + 1;

  const data = new Float32Array(width * height).fill(Infinity);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const gx = Math.floor((x - originX) / resolution);
    const gy = Math.floor((y - originY) / resolution);

    if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
      const idx = gy * width + gx;
      if (z < data[idx]) {
        data[idx] = z;
      }
    }
  }
  console.timeEnd('[extractGroundGrid] assign points to grid');

  console.time('[extractGroundGrid] findNearestGround');
  for (let i = 0; i < data.length; i++) {
    if (data[i] === Infinity) {
      data[i] = findNearestGround(data, i, width, height);
    }
  }
  console.timeEnd('[extractGroundGrid] findNearestGround');

  console.time('[extractGroundGrid] morphologicalOpen');
  const smoothed = morphologicalOpen(data, width, height, 2);
  for (let i = 0; i < data.length; i++) {
    data[i] = smoothed[i];
  }
  console.timeEnd('[extractGroundGrid] morphologicalOpen');

  console.timeEnd('[extractGroundGrid] total');
  return {
    resolution,
    originX,
    originY,
    width,
    height,
    data,
  };
}

function morphologicalOpen(data: Float32Array, width: number, height: number, radius: number): Float32Array {
  const eroded = morphologicalErode(data, width, height, radius);
  const opened = morphologicalDilate(eroded, width, height, radius);
  return opened;
}

function morphologicalErode(data: Float32Array, width: number, height: number, radius: number): Float32Array {
  const result = new Float32Array(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = Infinity;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const val = data[ny * width + nx];
            if (val < minVal) {
              minVal = val;
            }
          }
        }
      }

      result[y * width + x] = minVal;
    }
  }

  return result;
}

function morphologicalDilate(data: Float32Array, width: number, height: number, radius: number): Float32Array {
  const result = new Float32Array(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = -Infinity;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const val = data[ny * width + nx];
            if (val > maxVal) {
              maxVal = val;
            }
          }
        }
      }

      result[y * width + x] = maxVal === -Infinity ? 0 : maxVal;
    }
  }

  return result;
}

function findNearestGround(
  grid: Float32Array,
  index: number,
  width: number,
  height: number
): number {
  let minDist = Infinity;
  let nearestGround = 0;

  const x = index % width;
  const y = Math.floor(index / width);

  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (grid[nidx] !== Infinity) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            nearestGround = grid[nidx];
          }
        }
      }
    }
  }

  return nearestGround === Infinity ? 0 : nearestGround;
}

export function getGroundHeight(grid: GroundGrid, x: number, y: number): number {
  const gx = Math.floor((x - grid.originX) / grid.resolution);
  const gy = Math.floor((y - grid.originY) / grid.resolution);

  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) {
    return 0;
  }

  return grid.data[gy * grid.width + gx];
}

export function getGroundHeightSmooth(grid: GroundGrid, x: number, y: number, radius: number = 1): number {
  const gx = Math.floor((x - grid.originX) / grid.resolution);
  const gy = Math.floor((y - grid.originY) / grid.resolution);

  let totalWeight = 0;
  let weightedSum = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = gx + dx;
      const ny = gy + dy;

      if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
        const nidx = ny * grid.width + nx;
        const height = grid.data[nidx];

        if (height !== Infinity) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          const weight = 1 / (dist + 0.1);
          weightedSum += height * weight;
          totalWeight += weight;
        }
      }
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
