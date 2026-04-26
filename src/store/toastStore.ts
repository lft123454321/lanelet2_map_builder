import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'hint';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    const newToast = { ...toast, id };

    set((state) => {
      return {
        toasts: [...state.toasts, newToast],
      };
    });

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration || 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const TOOL_HINTS: Record<string, {激活: string; 操作提示: string[] }> = {
  select: {
    激活: '选择工具 - 点击图元进行选择',
    操作提示: ['点击图元选中', '配合 Ctrl 多选', '按 Delete 删除选中'],
  },
  pan: {
    激活: '平移工具 - 拖拽移动视图',
    操作提示: ['鼠标拖拽平移视图', '滚轮缩放', '右键拖拽也可平移'],
  },
  point: {
    激活: '点工具 - 点击添加点',
    操作提示: ['在地图上点击添加点', '点会自动放置在地面上', '按 ESC 取消'],
  },
  linestring: {
    激活: '线串工具 - 绘制折线',
    操作提示: ['点击添加顶点', '点击第2点后自动生成线串', '按 Enter 完成绘制', '按 ESC 取消'],
  },
  lanelet: {
    激活: '车道工具 - 绘制车道',
    操作提示: ['绘制左边界线', '再绘制右边界线', '系统自动创建车道', '按 ESC 取消'],
  },
  area: {
    激活: '区域工具 - 绘制闭合区域',
    操作提示: ['点击添加顶点', '点击第3点后自动闭合区域', '按 Enter 完成绘制', '按 ESC 取消'],
  },
  regulatory: {
    激活: '交通规则工具',
    操作提示: ['选择交通标志类型', '点击放置标志', '按 ESC 取消'],
  },
};

export const LANELET_STEPS = {
  等待绘制左边界: '请绘制左边界线：点击添加至少2个点',
  左边界完成: '左边界完成！现在绘制右边界线',
  等待绘制右边界: '请绘制右边界线：点击添加至少2个点',
  右边界完成: '车道创建完成！已被选中',
};
