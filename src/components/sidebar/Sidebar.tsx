import React, { useState } from 'react';
import {
  TreeStructure,
  CaretDown,
  CaretRight,
  CaretLeft,
  MapPin,
  Path,
  Rectangle,
  Hexagon,
  Warning,
  Eye,
  EyeSlash,
  Cursor,
  Hand,
  PushPin,
  Car,
  Signpost,
  Square,
  WarningCircle,
  Trash,
  FilePlus,
  Gear,
  CloudArrowUp,
  FileArrowDown,
  FileArrowUp,
} from '@phosphor-icons/react';
import { useMapStore } from '../../store/mapStore';
import { useEditorStore } from '../../store/editorStore';
import { useToastStore } from '../../store/toastStore';
import { useUIStore } from '../../store/uiStore';
import { usePCDStore } from '../../store/pcdStore';
import { writeOSM } from '../../utils/lanelet2';

const TOOLS = [
  { id: 'select', iconSrc: '/icons/select.svg', label: '选择', shortcut: 'V' },
  { id: 'pan', iconSrc: '/icons/pan.svg', label: '平移', shortcut: 'H' },
  { id: 'point', iconSrc: '/icons/point.svg', label: '点', shortcut: 'P' },
  { id: 'linestring', iconSrc: '/icons/linestring.svg', label: '线串', shortcut: 'L' },
  { id: 'lanelet', iconSrc: '/icons/lanelet.svg', label: '车道', shortcut: 'A' },
  { id: 'area', iconSrc: '/icons/area.svg', label: '区域', shortcut: 'G' },
  { id: 'regulatory', iconSrc: '/icons/regulatory.svg', label: '交通规则', shortcut: 'R' },
  { id: 'delete', iconSrc: '/icons/delete.svg', label: '删除', shortcut: 'D' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'elements'>('tools');

  const { points, linestrings, lanelets, areas, regulatoryElements, clearMap } = useMapStore();
  const { selectedIds, setSelectedIds, activeTool, setActiveTool, viewMode, setViewMode } = useEditorStore();
  const { addToast } = useToastStore();
  const { openSettingsModal, openImportOSMModal, openImportPCDModal } = useUIStore();
  const { showGroundDetection, setShowGroundDetection, groundDetection } = usePCDStore();

  const handleExportOSM = () => {
    const data = useMapStore.getState();
    const xml = writeOSM({
      points: data.points,
      linestrings: data.linestrings,
      lanelets: data.lanelets,
      areas: data.areas,
      regulatoryElements: data.regulatoryElements,
    });
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.osm';
    a.click();
    URL.revokeObjectURL(url);
    addToast({ message: '地图已导出', type: 'success', duration: 2000 });
  };

  const totalElements = Object.keys(points).length + Object.keys(linestrings).length +
    Object.keys(lanelets).length + Object.keys(areas).length + Object.keys(regulatoryElements).length;

  if (isCollapsed) {
    return (
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 rounded-lg bg-tahoe-surface border border-tahoe-border
                     flex items-center justify-center text-tahoe-text-secondary
                     hover:bg-tahoe-bg-hover transition-colors"
          title="展开侧边栏"
        >
          <TreeStructure size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-3 top-3 z-10 w-72 flex flex-col gap-1.5">
      {/* Header + Action Buttons */}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-tahoe-surface border border-tahoe-border">
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-tahoe-bg-hover rounded transition-colors"
          title="收起侧边栏"
        >
          <CaretLeft size={16} className="text-tahoe-text-secondary" />
        </button>
        <span className="text-sm font-medium text-tahoe-text">Lanelet2</span>
        <div className="flex-1" />
        <button
          onClick={() => { clearMap(); addToast({ message: '地图已清空', type: 'info', duration: 2000 }); }}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-tahoe-bg-hover transition-colors text-tahoe-text-secondary"
          title="新建地图"
        >
          <FilePlus size={14} />
        </button>
        <button
          onClick={openImportPCDModal}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-tahoe-bg-hover transition-colors text-tahoe-text-secondary"
          title="导入 PCD"
        >
          <CloudArrowUp size={14} />
        </button>
        <button
          onClick={openImportOSMModal}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-tahoe-bg-hover transition-colors text-tahoe-text-secondary"
          title="导入 OSM"
        >
          <FileArrowDown size={14} />
        </button>
        <button
          onClick={handleExportOSM}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-tahoe-bg-hover transition-colors text-tahoe-text-secondary"
          title="导出 OSM"
        >
          <FileArrowUp size={14} />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-lg bg-tahoe-surface border border-tahoe-border overflow-hidden">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'tools'
              ? 'bg-tahoe-accent text-white'
              : 'text-tahoe-text-secondary hover:bg-tahoe-bg-hover'
          }`}
        >
          工具
        </button>
        <button
          onClick={() => setActiveTab('elements')}
          className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'elements'
              ? 'bg-tahoe-accent text-white'
              : 'text-tahoe-text-secondary hover:bg-tahoe-bg-hover'
          }`}
        >
          元素
          {totalElements > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'elements' ? 'bg-white/20' : 'bg-tahoe-bg'
            }`}>
              {totalElements}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 rounded-lg bg-tahoe-surface border border-tahoe-border overflow-hidden">
        {activeTab === 'tools' ? (
          <div className="p-2 grid grid-cols-4 gap-1">
            {TOOLS.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as any)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg
                             transition-all text-[10px] gap-0.5 ${
                    isActive
                      ? 'bg-tahoe-accent text-white'
                      : 'text-tahoe-text-secondary hover:bg-tahoe-bg-hover hover:text-tahoe-text'
                  }`}
                  title={`${tool.label} (${tool.shortcut})`}
                >
                  <img
                    src={tool.iconSrc}
                    alt={tool.label}
                    className="w-6 h-6 object-contain"
                    style={{ filter: isActive ? 'brightness(0) invert(1)' : 'none' }}
                  />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <ElementTree
            points={points}
            linestrings={linestrings}
            lanelets={lanelets}
            areas={areas}
            regulatoryElements={regulatoryElements}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
          />
        )}
      </div>

      {/* View Controls */}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-tahoe-surface border border-tahoe-border">
        <button
          onClick={() => setViewMode('2d')}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            viewMode === '2d'
              ? 'bg-tahoe-accent text-white'
              : 'text-tahoe-text-secondary hover:bg-tahoe-bg-hover'
          }`}
        >
          2D
        </button>
        <button
          onClick={() => setViewMode('3d')}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            viewMode === '3d'
              ? 'bg-tahoe-accent text-white'
              : 'text-tahoe-text-secondary hover:bg-tahoe-bg-hover'
          }`}
        >
          3D
        </button>
        {groundDetection && (
          <button
            onClick={() => setShowGroundDetection(!showGroundDetection)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              showGroundDetection
                ? 'bg-green-600 text-white'
                : 'text-tahoe-text-secondary hover:bg-tahoe-bg-hover'
            }`}
          >
            地面
          </button>
        )}
      </div>
    </div>
  );
}

function ElementTree({
  points,
  linestrings,
  lanelets,
  areas,
  regulatoryElements,
  selectedIds,
  onSelect,
}: {
  points: Record<string, any>;
  linestrings: Record<string, any>;
  lanelets: Record<string, any>;
  areas: Record<string, any>;
  regulatoryElements: Record<string, any>;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['points', 'linestrings', 'lanelets']));
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleVisibility = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHidden = new Set(hiddenTypes);
    if (newHidden.has(type)) {
      newHidden.delete(type);
    } else {
      newHidden.add(type);
    }
    setHiddenTypes(newHidden);
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey && selectedIds.length > 0) {
      if (selectedIds.includes(id)) {
        onSelect(selectedIds.filter(sid => sid !== id));
      } else {
        onSelect([...selectedIds, id]);
      }
    } else {
      onSelect([id]);
    }
  };

  const groups = [
    { id: 'points', label: '点', icon: MapPin, items: points, itemType: 'point' },
    { id: 'linestrings', label: '线串', icon: Path, items: linestrings, itemType: 'linestring' },
    { id: 'lanelets', label: '车道', icon: Rectangle, items: lanelets, itemType: 'lanelet' },
    { id: 'areas', label: '区域', icon: Hexagon, items: areas, itemType: 'area' },
    { id: 'regulatoryElements', label: '交通', icon: Warning, items: regulatoryElements, itemType: 'regulatory' },
  ];

  const getItemLabel = (id: string, type: string) => {
    switch (type) {
      case 'point':
        const p = points[id];
        return p ? `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}` : id;
      case 'linestring':
        const l = linestrings[id];
        return l ? `${l.type} (${l.points?.length || 0})` : id;
      case 'lanelet':
        const ll = lanelets[id];
        return ll ? `${ll.subtype || 'road'}` : id;
      case 'area':
        const a = areas[id];
        return a ? `${a.subtype || 'area'}` : id;
      case 'regulatory':
        const r = regulatoryElements[id];
        return r ? r.subtype : id;
      default:
        return id;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'point': return 'text-blue-400';
      case 'linestring': return 'text-green-400';
      case 'lanelet': return 'text-yellow-400';
      case 'area': return 'text-purple-400';
      case 'regulatory': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col max-h-80 overflow-y-auto">
      {groups.map(group => {
        const itemIds = Object.keys(group.items);
        const isExpanded = expandedGroups.has(group.id);
        const isHidden = hiddenTypes.has(group.itemType);
        const Icon = group.icon;

        return (
          <div key={group.id}>
            <div
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-tahoe-bg-hover cursor-pointer"
              onClick={() => toggleGroup(group.id)}
            >
              {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
              <Icon size={14} className={getTypeColor(group.itemType)} />
              <span className="text-xs text-tahoe-text flex-1">{group.label}</span>
              <span className="text-[10px] text-tahoe-text-secondary bg-tahoe-bg px-1.5 rounded">
                {itemIds.length}
              </span>
              <button
                className="p-0.5 hover:bg-tahoe-bg rounded"
                onClick={(e) => toggleVisibility(group.itemType, e)}
                title={isHidden ? '显示' : '隐藏'}
              >
                {isHidden ? <EyeSlash size={12} /> : <Eye size={12} />}
              </button>
            </div>

            {isExpanded && !isHidden && itemIds.length > 0 && (
              <div className="bg-tahoe-bg-subtle">
                {itemIds.map(id => {
                  const isSelected = selectedIds.includes(id);
                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-tahoe-bg-hover ${
                        isSelected ? 'bg-tahoe-accent/20 text-tahoe-accent' : ''
                      }`}
                      onClick={(e) => handleSelect(id, e)}
                    >
                      <span className="text-[10px] font-mono flex-1 truncate">
                        {getItemLabel(id, group.itemType)}
                      </span>
                      <span className="text-[10px] text-tahoe-text-secondary font-mono">
                        {id.slice(0, 6)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}