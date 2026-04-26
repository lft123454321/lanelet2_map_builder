# Lanelet2 地图编辑器

一款基于 Web 的交互式 Lanelet2 地图编辑器，支持 3D 可视化编辑。

## 功能特性

- **交互式 3D 画布** - 在 3D 空间中可视化编辑地图，支持平移/旋转/缩放
- **点云支持** - 加载 PCD 文件作为背景参考
- **地面提取** - 从点云数据中提取地面
- **Lanelet2 格式** - 完全支持 Lanelet2 图元（点、线串、车道）
- **OSM 导入/导出** - 导入现有 OSM 地图并导出编辑结果

## 技术栈

- React 18 + TypeScript
- Three.js + React Three Fiber（3D 渲染）
- Zustand（状态管理）
- Tailwind CSS（样式）
- Vite（构建工具）
- Playwright（端到端测试）

## 快速开始

```bash
cd lanelet2-map-editor
npm install
npm run dev
```

在浏览器中打开 http://localhost:5173

## 键盘快捷键

| 键 | 功能 |
|----|------|
| V | 选择工具 |
| P | 点工具 |
| L | 线串工具 |
| A | 车道工具 |
| H | 平移工具 |
| 2 | 2D 视图 |
| 3 | 3D 视图 |
| Escape | 取消当前操作 |
| Delete | 删除选中元素 |

## 开发命令

```bash
# 类型检查
npx tsc --noEmit

# 运行测试
npx playwright test
```
