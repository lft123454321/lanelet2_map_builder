import React, { useState } from 'react';
import { TreeStructure, CaretDown, CaretRight, CaretLeft, MapPin, Path, Rectangle, Hexagon, Warning, Eye, EyeSlash } from '@phosphor-icons/react';
import { useMapStore } from '../../store/mapStore';
import { useEditorStore } from '../../store/editorStore';

interface TreeItem {
  id: string;
  label: string;
  type: string;
  icon: React.ReactNode;
  children?: TreeItem[];
}

export function ElementManager() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['points', 'linestrings', 'lanelets']));
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { points, linestrings, lanelets, areas, regulatoryElements } = useMapStore();
  const { selectedIds, setSelectedIds } = useEditorStore();

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleVisibility = (type: string) => {
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
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds([id]);
    }
  };

  const getItemById = (id: string) => {
    if (points[id]) return { item: points[id], type: 'point' };
    if (linestrings[id]) return { item: linestrings[id], type: 'linestring' };
    if (lanelets[id]) return { item: lanelets[id], type: 'lanelet' };
    if (areas[id]) return { item: areas[id], type: 'area' };
    if (regulatoryElements[id]) return { item: regulatoryElements[id], type: 'regulatory' };
    return null;
  };

  const getItemLabel = (id: string, type: string) => {
    switch (type) {
      case 'point':
        const p = points[id];
        return `P ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
      case 'linestring':
        const l = linestrings[id];
        return `${l.type} (${l.points.length} pts)`;
      case 'lanelet':
        const ll = lanelets[id];
        return `${ll.subtype || 'road'} (L: ${ll.leftBound?.slice(0, 8)}...)`;
      case 'area':
        const a = areas[id];
        return `${a.subtype || 'area'} (${a.outerBound.length} pts)`;
      case 'regulatory':
        const r = regulatoryElements[id];
        return r.subtype;
      default:
        return id;
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'point': return <MapPin size={14} className="text-blue-400" />;
      case 'linestring': return <Path size={14} className="text-green-400" />;
      case 'lanelet': return <Rectangle size={14} className="text-yellow-400" />;
      case 'area': return <Hexagon size={14} className="text-purple-400" />;
      case 'regulatory': return <Warning size={14} className="text-red-400" />;
      default: return null;
    }
  };

  const groups: { id: string; label: string; icon: React.ReactNode; items: Record<string, unknown>; itemType: string }[] = [
    { id: 'points', label: '点', icon: <MapPin size={16} />, items: points, itemType: 'point' },
    { id: 'linestrings', label: '线串', icon: <Path size={16} />, items: linestrings, itemType: 'linestring' },
    { id: 'lanelets', label: '车道', icon: <Rectangle size={16} />, items: lanelets, itemType: 'lanelet' },
    { id: 'areas', label: '区域', icon: <Hexagon size={16} />, items: areas, itemType: 'area' },
    { id: 'regulatoryElements', label: '交通规则', icon: <Warning size={16} />, items: regulatoryElements, itemType: 'regulatory' },
  ];

  if (isCollapsed) {
    return (
      <div className="absolute left-20 top-4 z-10">
        <button
          onClick={() => setIsCollapsed(false)}
          className="panel p-2 flex items-center gap-2 hover:bg-tahoe-bg-hover"
          title="展开元素管理器"
        >
          <TreeStructure size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-20 top-4 w-72 panel z-10 flex flex-col max-h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-tahoe-border">
        <TreeStructure size={18} />
        <span className="font-medium text-tahoe-text flex-1">元素管理器</span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-tahoe-bg rounded"
          title="收起"
        >
          <CaretLeft size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map(group => {
          const itemIds = Object.keys(group.items);
          const isExpanded = expandedGroups.has(group.id);
          const isHidden = hiddenTypes.has(group.itemType);

          return (
            <div key={group.id} className="border-b border-tahoe-border last:border-b-0">
              <div
                className="flex items-center gap-2 px-3 py-2 hover:bg-tahoe-bg-hover cursor-pointer"
                onClick={() => toggleGroup(group.id)}
              >
                {isExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                {group.icon}
                <span className="text-sm text-tahoe-text flex-1">{group.label}</span>
                <span className="text-xs text-tahoe-text-secondary bg-tahoe-bg px-1.5 py-0.5 rounded">
                  {itemIds.length}
                </span>
                <button
                  className="p-1 hover:bg-tahoe-bg rounded"
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(group.itemType); }}
                  title={isHidden ? '显示' : '隐藏'}
                >
                  {isHidden ? <EyeSlash size={14} className="text-tahoe-text-secondary" /> : <Eye size={14} className="text-tahoe-text-secondary" />}
                </button>
              </div>

              {isExpanded && !isHidden && itemIds.length > 0 && (
                <div className="bg-tahoe-bg-subtle">
                  {itemIds.map(id => {
                    const isSelected = selectedIds.includes(id);
                    return (
                      <div
                        key={id}
                        className={`flex items-center gap-2 px-4 py-1.5 pl-8 cursor-pointer hover:bg-tahoe-bg-hover ${
                          isSelected ? 'bg-tahoe-accent/20 text-tahoe-accent' : ''
                        }`}
                        onClick={(e) => handleSelect(id, e)}
                      >
                        {getItemIcon(group.itemType)}
                        <span className="text-xs font-mono flex-1 truncate">{getItemLabel(id, group.itemType)}</span>
                        <span className="text-xs text-tahoe-text-secondary font-mono">{id.slice(0, 8)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {isExpanded && isHidden && (
                <div className="bg-tahoe-bg-subtle px-4 py-2 pl-8 text-xs text-tahoe-text-secondary italic">
                  已隐藏
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-tahoe-border text-xs text-tahoe-text-secondary">
        共 {Object.keys(points).length + Object.keys(linestrings).length + Object.keys(lanelets).length + Object.keys(areas).length + Object.keys(regulatoryElements).length} 个元素
      </div>
    </div>
  );
}