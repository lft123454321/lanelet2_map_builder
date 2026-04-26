import type { MapData, Point3D, Linestring, Lanelet, Area, RegulatoryElement } from '../../types';

export function parseOSM(xmlString: string): MapData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const data: MapData = {
    points: {},
    linestrings: {},
    lanelets: {},
    areas: {},
    regulatoryElements: {},
  };

  const nodes = doc.querySelectorAll('node');
  const ways = doc.querySelectorAll('way');
  const relations = doc.querySelectorAll('relation');

  for (const node of nodes) {
    const id = node.getAttribute('id') || '';
    const lat = parseFloat(node.getAttribute('lat') || '0');
    const lon = parseFloat(node.getAttribute('lon') || '0');
    const z = parseFloat(node.getAttribute('ele') || '0');

    const tags: Record<string, string> = {};
    const tagElements = node.querySelectorAll('tag');
    for (const tag of tagElements) {
      const k = tag.getAttribute('k');
      const v = tag.getAttribute('v');
      if (k && v) {
        tags[k] = v;
      }
    }

    if (tags.type === 'point' || Object.keys(tags).length === 0) {
      data.points[id] = {
        id,
        x: lon,
        y: lat,
        z,
        tags,
      };
    }
  }

  for (const way of ways) {
    const id = way.getAttribute('id') || '';
    const pointIds: string[] = [];

    const ndElements = way.querySelectorAll('nd');
    for (const nd of ndElements) {
      const ref = nd.getAttribute('ref');
      if (ref) {
        pointIds.push(ref);
      }
    }

    const tags: Record<string, string> = {};
    const tagElements = way.querySelectorAll('tag');
    for (const tag of tagElements) {
      const k = tag.getAttribute('k');
      const v = tag.getAttribute('v');
      if (k && v) {
        tags[k] = v;
      }
    }

    const type = tags.type || 'linestring';
    const subtype = tags.subtype || 'solid';

    if (type === 'lanelet') {
      const leftBound = tags.leftBound || '';
      const rightBound = tags.rightBound || '';
      const centerline = tags.centerline || '';

      if (leftBound && rightBound) {
        data.lanelets[id] = {
          id,
          leftBound,
          rightBound,
          centerline: centerline || undefined,
          subtype: (tags.subtype as Lanelet['subtype']) || 'road',
          location: (tags.location as Lanelet['location']) || 'urban',
          oneWay: tags.one_way !== 'no',
          regulatoryElements: [],
          tags,
        };
      }
    } else if (type === 'area' || type === 'multipolygon') {
      data.areas[id] = {
        id,
        outerBound: pointIds,
        innerBounds: [],
        subtype: subtype || 'freespace',
        regulatoryElements: [],
        tags,
      };
    } else {
      data.linestrings[id] = {
        id,
        points: pointIds,
        type: (type as Linestring['type']) || 'line_thin',
        subtype,
        tags,
      };
    }
  }

  for (const relation of relations) {
    const id = relation.getAttribute('id') || '';
    const tags: Record<string, string> = {};
    const tagElements = relation.querySelectorAll('tag');
    for (const tag of tagElements) {
      const k = tag.getAttribute('k');
      const v = tag.getAttribute('v');
      if (k && v) {
        tags[k] = v;
      }
    }

    const type = tags.type;
    const subtype = tags.subtype;

    if (type === 'regulatory_element') {
      const refers: string[] = [];
      const refLines: string[] = [];
      const cancels: string[] = [];
      const cancelLines: string[] = [];

      const members = relation.querySelectorAll('member');
      for (const member of members) {
        const ref = member.getAttribute('ref');
        const role = member.getAttribute('role');
        if (!ref) continue;

        switch (role) {
          case 'refers':
            refers.push(ref);
            break;
          case 'ref_line':
            refLines.push(ref);
            break;
          case 'cancels':
            cancels.push(ref);
            break;
          case 'cancel_line':
            cancelLines.push(ref);
            break;
        }
      }

      data.regulatoryElements[id] = {
        id,
        subtype: (subtype as RegulatoryElement['subtype']) || 'speed_limit',
        refers,
        cancels,
        refLines,
        cancelLines,
        tags,
      };
    } else if (type === 'lanelet' || type === 'multipolygon') {
    }
  }

  return data;
}
