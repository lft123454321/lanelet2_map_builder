import {
  Cursor,
  Hand,
  Dot,
  Path,
  Rectangle,
  Hexagon,
  Warning,
  Trash,
} from '@phosphor-icons/react';
import type { ToolType } from '../../types';

export interface ToolDefinition {
  id: ToolType;
  icon: any;
  label: string;
  shortcut: string;
}

export const tools: ToolDefinition[] = [
  { id: 'select', icon: Cursor, label: '选择', shortcut: 'V' },
  { id: 'pan', icon: Hand, label: '平移', shortcut: 'H' },
  { id: 'point', icon: Dot, label: '点', shortcut: 'P' },
  { id: 'linestring', icon: Path, label: '线串', shortcut: 'L' },
  { id: 'lanelet', icon: Rectangle, label: '车道', shortcut: 'A' },
  { id: 'area', icon: Hexagon, label: '区域', shortcut: 'G' },
  { id: 'regulatory', icon: Warning, label: '交通规则', shortcut: 'R' },
  { id: 'delete', icon: Trash, label: '删除', shortcut: 'D' },
];
