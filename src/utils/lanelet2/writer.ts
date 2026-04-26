import type { MapData, Point3D, Linestring, Lanelet, Area, RegulatoryElement } from '../../types';

export function writeOSM(data: MapData): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<osm version="0.6" generator="Lanelet2MapEditor">');

  let nodeId = -1;
  let wayId = -1;
  let relationId = -1;

  const nodeIdMap = new Map<string, string>();
  const wayIdMap = new Map<string, string>();

  for (const point of Object.values(data.points)) {
    const osmId = (nodeId--).toString();
    nodeIdMap.set(point.id, osmId);

    lines.push(`  <node id="${osmId}" lat="${point.y}" lon="${point.x}" ele="${point.z}">`);
    for (const [k, v] of Object.entries(point.tags)) {
      lines.push(`    <tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`);
    }
    lines.push('  </node>');
  }

  for (const ls of Object.values(data.linestrings)) {
    const osmId = (wayId--).toString();
    wayIdMap.set(ls.id, osmId);

    lines.push(`  <way id="${osmId}">`);
    for (const ptId of ls.points) {
      const ptOsmId = nodeIdMap.get(ptId) || ptId;
      lines.push(`    <nd ref="${ptOsmId}"/>`);
    }

    lines.push(`    <tag k="type" v="${escapeXml(ls.type)}"/>`);
    lines.push(`    <tag k="subtype" v="${escapeXml(ls.subtype)}"/>`);
    for (const [k, v] of Object.entries(ls.tags)) {
      if (k !== 'type' && k !== 'subtype') {
        lines.push(`    <tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`);
      }
    }
    lines.push('  </way>');
  }

  for (const area of Object.values(data.areas)) {
    const osmId = (wayId--).toString();
    wayIdMap.set(area.id, osmId);

    lines.push(`  <way id="${osmId}">`);
    for (const ptId of area.outerBound) {
      const ptOsmId = nodeIdMap.get(ptId) || ptId;
      lines.push(`    <nd ref="${ptOsmId}"/>`);
    }

    lines.push(`    <tag k="type" v="multipolygon"/>`);
    lines.push(`    <tag k="subtype" v="${escapeXml(area.subtype)}"/>`);
    for (const [k, v] of Object.entries(area.tags)) {
      if (k !== 'type' && k !== 'subtype') {
        lines.push(`    <tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`);
      }
    }
    lines.push('  </way>');
  }

  for (const lanelet of Object.values(data.lanelets)) {
    const osmId = (relationId--).toString();

    lines.push(`  <relation id="${osmId}">`);
    lines.push(`    <tag k="type" v="lanelet"/>`);
    lines.push(`    <tag k="subtype" v="${escapeXml(lanelet.subtype)}"/>`);
    lines.push(`    <tag k="location" v="${escapeXml(lanelet.location)}"/>`);
    lines.push(`    <tag k="one_way" v="${lanelet.oneWay ? 'yes' : 'no'}"/>`);

    lines.push(`    <member type="way" ref="${wayIdMap.get(lanelet.leftBound) || lanelet.leftBound}" role="leftBound"/>`);
    lines.push(`    <member type="way" ref="${wayIdMap.get(lanelet.rightBound) || lanelet.rightBound}" role="rightBound"/>`);

    if (lanelet.centerline) {
      lines.push(`    <member type="way" ref="${wayIdMap.get(lanelet.centerline) || lanelet.centerline}" role="centerline"/>`);
    }

    for (const regId of lanelet.regulatoryElements) {
      lines.push(`    <member type="relation" ref="${regId}" role="regulatory_element"/>`);
    }

    for (const [k, v] of Object.entries(lanelet.tags)) {
      if (!['type', 'subtype', 'location', 'one_way', 'leftBound', 'rightBound', 'centerline'].includes(k)) {
        lines.push(`    <tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`);
      }
    }
    lines.push('  </relation>');
  }

  for (const reg of Object.values(data.regulatoryElements)) {
    const osmId = (relationId--).toString();

    lines.push(`  <relation id="${osmId}">`);
    lines.push(`    <tag k="type" v="regulatory_element"/>`);
    lines.push(`    <tag k="subtype" v="${escapeXml(reg.subtype)}"/>`);

    for (const ref of reg.refers) {
      const refId = wayIdMap.get(ref) || nodeIdMap.get(ref) || ref;
      lines.push(`    <member type="way" ref="${refId}" role="refers"/>`);
    }

    for (const refLine of reg.refLines) {
      const refId = wayIdMap.get(refLine) || refLine;
      lines.push(`    <member type="way" ref="${refId}" role="ref_line"/>`);
    }

    for (const cancel of reg.cancels) {
      lines.push(`    <member type="way" ref="${wayIdMap.get(cancel) || cancel}" role="cancels"/>`);
    }

    for (const cancelLine of reg.cancelLines) {
      lines.push(`    <member type="way" ref="${wayIdMap.get(cancelLine) || cancelLine}" role="cancel_line"/>`);
    }

    for (const [k, v] of Object.entries(reg.tags)) {
      if (!['type', 'subtype'].includes(k)) {
        lines.push(`    <tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`);
      }
    }
    lines.push('  </relation>');
  }

  lines.push('</osm>');

  return lines.join('\n');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
