import React, { useState, useCallback } from 'react';
import { CloudArrowUp, Spinner } from '@phosphor-icons/react';
import { Modal, Button, Slider } from '../ui';
import { usePCDStore } from '../../store/pcdStore';
import { useUIStore } from '../../store/uiStore';
import { parsePCDFile } from '../../utils/pcd';
import { extractGroundGrid } from '../../utils/geometry';
import type { PCDConfig, GroundGrid } from '../../types';

export function ImportPCDModal() {
  const { showImportPCDModal, closeImportPCDModal } = useUIStore();
  const { setPointCloud, setGroundGrid, setLoading, setProgress, config, setConfig, groundConfig, setGroundConfig, isLoading, loadingProgress } = usePCDStore();

  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.pcd')) {
      alert('请选择 PCD 文件');
      return;
    }

    setLoading(true);

    try {
      const pointCloud = await parsePCDFile(file, config, (p) => setProgress(p));

      setPointCloud(pointCloud);

      const grid = extractGroundGrid(pointCloud, groundConfig);
      setGroundGrid(grid);

      closeImportPCDModal();
    } catch (error) {
      console.error('Failed to load PCD:', error);
      alert('加载 PCD 文件失败');
    } finally {
      setLoading(false);
    }
  }, [config, groundConfig, setPointCloud, setGroundGrid, setLoading, setProgress, closeImportPCDModal]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <Modal
      isOpen={showImportPCDModal}
      onClose={closeImportPCDModal}
      title="导入点云 (PCD)"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={closeImportPCDModal}>
            取消
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-tahoe-lg p-12 text-center transition-colors
            ${dragOver ? 'border-tahoe-accent bg-tahoe-accent/5' : 'border-tahoe-border'}
          `}
        >
          <CloudArrowUp size={48} className={`mx-auto mb-4 ${dragOver ? 'text-tahoe-accent' : 'text-tahoe-text-secondary'}`} />
          <p className="text-tahoe-text font-medium mb-2">
            拖拽 PCD 文件到这里
          </p>
          <p className="text-sm text-tahoe-text-secondary mb-4">
            或
          </p>
          <label className="btn-primary inline-block cursor-pointer">
            选择文件
            <input
              type="file"
              accept=".pcd"
              onChange={handleFileInput}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>

        {isLoading && (
          <div className="text-center">
            <Spinner size={32} className="animate-spin mx-auto mb-2 text-tahoe-accent" />
            <p className="text-sm text-tahoe-text-secondary">
              正在加载... {loadingProgress}%
            </p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium text-tahoe-text">点云设置</h3>

          <Slider
            label="目标点数"
            value={config.targetPointCount}
            onChange={(v) => setConfig({ targetPointCount: Math.round(v) })}
            min={100000}
            max={2000000}
            step={100000}
            unit=" 点"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-tahoe-text mb-2 block">着色模式</label>
              <select
                value={config.coloringMode}
                onChange={(e) => setConfig({ coloringMode: e.target.value as PCDConfig['coloringMode'] })}
                className="input w-full"
              >
                <option value="height">按高度</option>
                <option value="intensity">按强度</option>
                <option value="single">单色</option>
              </select>
            </div>

            {config.coloringMode === 'single' && (
              <div>
                <label className="text-sm font-medium text-tahoe-text mb-2 block">颜色</label>
                <input
                  type="color"
                  value={config.singleColor}
                  onChange={(e) => setConfig({ singleColor: e.target.value })}
                  className="w-full h-10 rounded-tahoe border border-tahoe-border cursor-pointer"
                />
              </div>
            )}
          </div>

          {config.coloringMode === 'height' && (
            <div className="grid grid-cols-2 gap-4">
              <Slider
                label="高度最小值"
                value={config.heightColorRange[0]}
                onChange={(v) => setConfig({ heightColorRange: [v, config.heightColorRange[1]] })}
                min={-10}
                max={0}
                step={0.5}
                unit="m"
              />
              <Slider
                label="高度最大值"
                value={config.heightColorRange[1]}
                onChange={(v) => setConfig({ heightColorRange: [config.heightColorRange[0], v] })}
                min={0}
                max={50}
                step={0.5}
                unit="m"
              />
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-tahoe-border">
          <h3 className="font-medium text-tahoe-text">地面提取设置 (CSF)</h3>

          <Slider
            label="网格分辨率"
            value={groundConfig.gridResolution}
            onChange={(v) => setGroundConfig({ gridResolution: v })}
            min={0.1}
            max={2}
            step={0.1}
            unit="m"
          />

          <Slider
            label="搜索半径"
            value={groundConfig.searchRadius}
            onChange={(v) => setGroundConfig({ searchRadius: v })}
            min={0.5}
            max={3}
            step={0.1}
            unit="m"
          />
        </div>
      </div>
    </Modal>
  );
}
