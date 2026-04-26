import React from 'react';
import { Tag, Info, MapPin, Path, Rectangle, Hexagon, Warning } from '@phosphor-icons/react';
import { useEditorStore } from '../../store/editorStore';
import { useMapStore } from '../../store/mapStore';
import { Input, Select } from '../ui';
import type { Linestring, Lanelet, Point3D, Area, RegulatoryElement } from '../../types';

const LINESTRING_TYPES = [
  { value: 'line_thin', label: '细线' },
  { value: 'line_thick', label: '粗线' },
  { value: 'curbstone', label: '路缘石' },
  { value: 'virtual', label: '虚拟边界' },
  { value: 'road_border', label: '道路边界' },
  { value: 'guard_rail', label: '护栏' },
  { value: 'zebra_marking', label: '斑马线' },
  { value: 'stop_line', label: '停车线' },
  { value: 'yield_line', label: '让行线' },
  { value: 'arrow', label: '箭头' },
];

const LINESTRING_SUBTYPES = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'solid_solid', label: '双实线' },
  { value: 'dashed_solid', label: '左虚右实' },
  { value: 'solid_dashed', label: '左实右虚' },
];

const LANELET_SUBTYPES = [
  { value: 'road', label: '道路' },
  { value: 'highway', label: '高速公路' },
  { value: 'bicycle_lane', label: '自行车道' },
  { value: 'walkway', label: '人行道' },
  { value: 'crosswalk', label: '人行横道' },
  { value: 'parking', label: '停车场' },
];

export function PropertiesPanel() {
  const { selectedIds, setSelectedIds } = useEditorStore();
  const { getPoint, getLinestring, getLanelet, getArea, getRegulatoryElement, updateLinestring, updateLanelet } = useMapStore();

  if (selectedIds.length === 0) {
    return (
      <div className="absolute right-4 top-4 w-80 panel p-4 z-10">
        <div className="text-center text-tahoe-text-secondary py-8">
          <Info size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">选择图元以编辑属性</p>
        </div>
      </div>
    );
  }

  const firstId = selectedIds[0];
  const point = getPoint(firstId);
  const linestring = getLinestring(firstId);
  const lanelet = getLanelet(firstId);
  const area = getArea(firstId);
  const regulatory = getRegulatoryElement(firstId);

  let title = '属性';
  let icon = <Info size={18} />;
  let content: React.ReactNode = null;

  if (point) {
    title = '点';
    icon = <MapPin size={18} />;
    content = <PointProperties point={point} />;
  } else if (linestring) {
    title = '线串';
    icon = <Path size={18} />;
    content = <LinestringProperties linestring={linestring} points={useMapStore.getState().points} onUpdate={(u) => updateLinestring(firstId, u)} onSelectPoint={(id) => setSelectedIds([id])} />;
  } else if (lanelet) {
    title = '车道';
    icon = <Rectangle size={18} />;
    content = <LaneletProperties lanelet={lanelet} onUpdate={(u) => updateLanelet(firstId, u)} onSelectLinestring={(id) => setSelectedIds([id])} />;
  } else if (area) {
    title = '区域';
    icon = <Hexagon size={18} />;
    content = <AreaProperties area={area} />;
  } else if (regulatory) {
    title = '交通规则';
    icon = <Warning size={18} />;
    content = <RegulatoryProperties regulatory={regulatory} />;
  }

  return (
    <div className="absolute right-4 top-4 w-80 panel z-10 flex flex-col max-h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-tahoe-border">
        {icon}
        <span className="font-medium text-tahoe-text">{title}</span>
        <span className="text-xs text-tahoe-text-secondary ml-auto">
          {selectedIds.length > 1 ? `${selectedIds.length} 个选中` : firstId}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {content}
      </div>
    </div>
  );
}

function PointProperties({ point }: { point: Point3D }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Input label="X" value={point.x.toFixed(3)} readOnly />
        <Input label="Y" value={point.y.toFixed(3)} readOnly />
        <Input label="Z" value={point.z.toFixed(3)} readOnly />
      </div>
      <TagEditor tags={point.tags} />
    </div>
  );
}

function LinestringProperties({
  linestring,
  points,
  onUpdate,
  onSelectPoint,
}: {
  linestring: Linestring;
  points: Record<string, Point3D>;
  onUpdate: (u: Partial<Linestring>) => void;
  onSelectPoint: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-tahoe-text-secondary">
        {linestring.points.length} 个顶点
      </div>
      <div className="space-y-1">
        {linestring.points.map((ptId, idx) => {
          const pt = points[ptId];
          return (
            <button
              key={ptId}
              onClick={() => onSelectPoint(ptId)}
              className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-tahoe-bg-hover text-left"
            >
              <span className="text-xs text-tahoe-text-secondary w-4">{idx + 1}</span>
              <span className="text-xs font-mono text-tahoe-accent">
                {ptId}
              </span>
              <span className="text-xs font-mono text-tahoe-text-secondary flex-1 truncate">
                {pt ? `${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}, ${pt.z.toFixed(1)}` : '(未找到)'}
              </span>
            </button>
          );
        })}
      </div>
      <Select
        label="类型"
        value={linestring.type}
        onChange={(v) => onUpdate({ type: v as Linestring['type'] })}
        options={LINESTRING_TYPES}
      />
      <Select
        label="子类型"
        value={linestring.subtype}
        onChange={(v) => onUpdate({ subtype: v })}
        options={LINESTRING_SUBTYPES}
      />
      <TagEditor tags={linestring.tags} />
    </div>
  );
}

function LaneletProperties({
  lanelet,
  onUpdate,
  onSelectLinestring,
}: {
  lanelet: Lanelet;
  onUpdate: (u: Partial<Lanelet>) => void;
  onSelectLinestring: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-tahoe-text-secondary">左边界</label>
          <button
            onClick={() => onSelectLinestring(lanelet.leftBound)}
            className="text-sm font-mono text-tahoe-accent hover:underline block truncate"
            title={lanelet.leftBound}
          >
            {lanelet.leftBound}
          </button>
        </div>
        <div>
          <label className="text-xs text-tahoe-text-secondary">右边界</label>
          <button
            onClick={() => onSelectLinestring(lanelet.rightBound)}
            className="text-sm font-mono text-tahoe-accent hover:underline block truncate"
            title={lanelet.rightBound}
          >
            {lanelet.rightBound}
          </button>
        </div>
      </div>
      <Select
        label="子类型"
        value={lanelet.subtype}
        onChange={(v) => onUpdate({ subtype: v as Lanelet['subtype'] })}
        options={LANELET_SUBTYPES}
      />
      <Select
        label="位置"
        value={lanelet.location}
        onChange={(v) => onUpdate({ location: v as 'urban' | 'nonurban' })}
        options={[
          { value: 'urban', label: '城市' },
          { value: 'nonurban', label: '郊区' },
        ]}
      />
      <Select
        label="方向"
        value={lanelet.oneWay ? 'yes' : 'no'}
        onChange={(v) => onUpdate({ oneWay: v === 'yes' })}
        options={[
          { value: 'yes', label: '单向' },
          { value: 'no', label: '双向' },
        ]}
      />
      <TagEditor tags={lanelet.tags} />
    </div>
  );
}

function AreaProperties({ area }: { area: Area }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-tahoe-text-secondary">
        外边界: {area.outerBound.length} 个顶点
      </div>
      <TagEditor tags={area.tags} />
    </div>
  );
}

function RegulatoryProperties({ regulatory }: { regulatory: RegulatoryElement }) {
  return (
    <div className="space-y-4">
      <Select
        label="类型"
        value={regulatory.subtype}
        onChange={() => {}}
        options={[
          { value: 'speed_limit', label: '限速' },
          { value: 'traffic_sign', label: '交通标志' },
          { value: 'traffic_light', label: '交通信号灯' },
          { value: 'right_of_way', label: '优先权' },
        ]}
      />
      <div className="text-sm text-tahoe-text-secondary">
        引用: {regulatory.refers.length} 个元素
      </div>
      <TagEditor tags={regulatory.tags} />
    </div>
  );
}

function TagEditor({ tags }: { tags: Record<string, string> }) {
  const [newKey, setNewKey] = React.useState('');
  const [newValue, setNewValue] = React.useState('');

  const entries = Object.entries(tags);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-tahoe-text">
        <Tag size={14} />
        标签
      </div>

      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="text-tahoe-accent font-mono">{key}</span>
            <span className="text-tahoe-text-secondary">=</span>
            <span className="text-tahoe-text font-mono flex-1 truncate">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-tahoe-border">
        <Input
          placeholder="键"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1 text-sm"
        />
        <Input
          placeholder="值"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 text-sm"
        />
      </div>
    </div>
  );
}
