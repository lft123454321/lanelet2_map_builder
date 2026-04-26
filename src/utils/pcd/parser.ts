import type { PCDHeader, PCDPoint, ProcessedPointCloud, PCDConfig } from '../../types';

export function parsePCDHeader(lines: string[]): PCDHeader {
  const header: Partial<PCDHeader> = {
    fields: [],
    size: [],
    type: [],
    count: [],
  };

  let dataStarted = false;

  for (const line of lines) {
    if (dataStarted) break;

    const trimmed = line.trim();
    if (trimmed === 'DATA binary' || trimmed === 'DATA ascii') {
      header.data = trimmed === 'DATA binary' ? 'binary' : 'ascii';
      dataStarted = true;
      continue;
    }

    const [key, ...valueParts] = trimmed.split(/\s+/);
    const value = valueParts.join(' ');

    switch (key) {
      case 'VERSION':
        header.version = value;
        break;
      case 'FIELDS':
        header.fields = value.split(/\s+/);
        break;
      case 'SIZE':
        header.size = value.split(/\s+/).map(Number);
        break;
      case 'TYPE':
        header.type = value.split(/\s+/);
        break;
      case 'COUNT':
        header.count = value.split(/\s+/).map(Number);
        break;
      case 'WIDTH':
        header.width = parseInt(value, 10);
        break;
      case 'HEIGHT':
        header.height = parseInt(value, 10);
        break;
      case 'POINTS':
        header.points = parseInt(value, 10);
        break;
      case 'VIEWPOINT': {
        const parts = value.split(/\s+/);
        header.viewpoint = [
          parseFloat(parts[0]) || 0,
          parseFloat(parts[1]) || 0,
          parseFloat(parts[2]) || 0,
          parseFloat(parts[3]) || 1,
          parseFloat(parts[4]) || 0,
          parseFloat(parts[5]) || 0,
          parseFloat(parts[6]) || 0,
        ];
        break;
      }
    }
  }

  return header as PCDHeader;
}

interface FieldInfo {
  name: string;
  size: number;
  type: string;
  count: number;
}

function parseBinaryPCD(
  buffer: ArrayBuffer,
  header: PCDHeader,
  _byteOffset: number
): PCDPoint[] {
  const points: PCDPoint[] = [];
  const { fields, size, type, count } = header;

  const fieldInfo: FieldInfo[] = fields.map((field, i) => ({
    name: field,
    size: size[i],
    type: type[i],
    count: count[i],
  }));

  const stride = fieldInfo.reduce((sum: number, f: FieldInfo) => sum + f.size * f.count, 0);
  const view = new DataView(buffer);
  const littleEndian = true;

  for (let i = 0; i < header.points; i++) {
    const point: PCDPoint = { x: 0, y: 0, z: 0 };
    let offset = i * stride;

    for (const field of fieldInfo) {
      let value = 0;

      for (let j = 0; j < field.count; j++) {
        switch (field.type) {
          case 'F':
            if (field.size === 4) {
              value = view.getFloat32(offset, littleEndian);
            } else if (field.size === 8) {
              value = view.getFloat64(offset, littleEndian);
            }
            break;
          case 'U':
            if (field.size === 1) {
              value = view.getUint8(offset);
            } else if (field.size === 2) {
              value = view.getUint16(offset, littleEndian);
            } else if (field.size === 4) {
              value = view.getUint32(offset, littleEndian);
            }
            break;
          case 'I':
            if (field.size === 1) {
              value = view.getInt8(offset);
            } else if (field.size === 2) {
              value = view.getInt16(offset, littleEndian);
            } else if (field.size === 4) {
              value = view.getInt32(offset, littleEndian);
            }
            break;
        }

        switch (field.name) {
          case 'x':
            point.x = value;
            break;
          case 'y':
            point.y = value;
            break;
          case 'z':
            point.z = value;
            break;
          case 'intensity':
            point.intensity = value;
            break;
        }

        offset += field.size;
      }
    }

    points.push(point);
  }

  return points;
}

export async function parsePCDFile(
  file: File,
  config: PCDConfig,
  onProgress?: (progress: number) => void
): Promise<ProcessedPointCloud> {
  console.time('[parsePCDFile] total');
  console.time('[parsePCDFile] file.text()');
  const text = await file.text();
  console.timeEnd('[parsePCDFile] file.text()');
  console.time('[parsePCDFile] split lines');
  const lines = text.split('\n');
  console.timeEnd('[parsePCDFile] split lines');

  let headerEndIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'DATA binary' || lines[i].trim() === 'DATA ascii') {
      headerEndIndex = i;
      break;
    }
  }

  const headerLines = lines.slice(0, headerEndIndex + 1);
  const header = parsePCDHeader(headerLines);

  let points: PCDPoint[];

  if (header.data === 'binary') {
    console.time('[parsePCDFile] binary parse');
    const headerText = headerLines.join('\n') + '\n';
    const headerBytes = new TextEncoder().encode(headerText).length;
    const fullBuffer = await file.arrayBuffer();
    const dataSlice = fullBuffer.slice(headerBytes);
    points = parseBinaryPCD(dataSlice, header, 0);
    console.timeEnd('[parsePCDFile] binary parse');
  } else {
    console.time('[parsePCDFile] ascii parse');
    const dataLines = lines.slice(headerEndIndex + 1);
    points = [];

    for (const line of dataLines) {
      if (!line.trim()) continue;
      const values = line.trim().split(/\s+/);
      const point: PCDPoint = { x: 0, y: 0, z: 0 };

      for (let i = 0; i < header.fields.length; i++) {
        const value = parseFloat(values[i]);
        switch (header.fields[i]) {
          case 'x':
            point.x = value;
            break;
          case 'y':
            point.y = value;
            break;
          case 'z':
            point.z = value;
            break;
          case 'intensity':
            point.intensity = value;
            break;
        }
      }

      points.push(point);
    }
    console.timeEnd('[parsePCDFile] ascii parse');
  }

  onProgress?.(30);

  const downsampled = config.noDownsample ? points : downsamplePoints(points, config.targetPointCount);
  onProgress?.(60);

  console.time('[parsePCDFile] colorizePoints');
  const colored = colorizePoints(downsampled, config);
  console.timeEnd('[parsePCDFile] colorizePoints');
  onProgress?.(90);

  console.timeEnd('[parsePCDFile] total');
  return colored;
}

function downsamplePoints(points: PCDPoint[], targetCount: number): PCDPoint[] {
  console.time('[downsamplePoints] total');
  if (points.length <= targetCount) {
    return points;
  }

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  const area = (maxX - minX) * (maxZ - minZ);
  const gridSize = Math.sqrt(area / targetCount);

  const grid = new Map<number, number>();

  console.time('[downsamplePoints] assign to grid');
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const gx = Math.floor((p.x - minX) / gridSize);
    const gz = Math.floor((p.z - minZ) / gridSize);
    const key = gx * 1000000 + gz;

    if (!grid.has(key)) {
      grid.set(key, i);
    }
  }
  console.timeEnd('[downsamplePoints] assign to grid');

  console.time('[downsamplePoints] collect results');
  const sampled: PCDPoint[] = [];
  for (const idx of grid.values()) {
    sampled.push(points[idx]);
  }
  console.timeEnd('[downsamplePoints] collect results');

  console.timeEnd('[downsamplePoints] total');
  return sampled;
}

function colorizePoints(
  points: PCDPoint[],
  config: PCDConfig
): ProcessedPointCloud {
  const positions = new Float32Array(points.length * 3);
  const colors = new Float32Array(points.length * 3);
  const intensities = new Float32Array(points.length);

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let maxIntensity = 0;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
    if (p.intensity && p.intensity > maxIntensity) maxIntensity = p.intensity;
  }

  const [colorMin, colorMax] = config.heightColorRange;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
    intensities[i] = p.intensity || 0;

    let r = 1, g = 1, b = 1;

    if (config.coloringMode === 'height') {
      const t = Math.max(0, Math.min(1, (p.z - colorMin) / (colorMax - colorMin)));

      if (t < 0.25) {
        r = 0;
        g = t * 4;
        b = 1;
      } else if (t < 0.5) {
        r = 0;
        g = 1;
        b = 1 - (t - 0.25) * 4;
      } else if (t < 0.75) {
        r = (t - 0.5) * 4;
        g = 1;
        b = 0;
      } else {
        r = 1;
        g = 1 - (t - 0.75) * 4;
        b = 0;
      }
    } else if (config.coloringMode === 'intensity') {
      const t = maxIntensity > 0 ? (p.intensity || 0) / maxIntensity : 0;
      r = t;
      g = t;
      b = t;
    } else {
      const hex = config.singleColor.replace('#', '');
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  return {
    positions,
    colors,
    intensities,
    boundingBox: {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    },
    center: [
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2,
    ],
  };
}
