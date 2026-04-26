import { Modal, Slider } from '../ui';
import { useUIStore } from '../../store/uiStore';
import { usePCDStore } from '../../store/pcdStore';
import { useMapStore } from '../../store/mapStore';

export function SettingsModal() {
  const { showSettingsModal, closeSettingsModal } = useUIStore();
  const { config, setConfig, groundConfig, setGroundConfig, clearPCD } = usePCDStore();
  const { clearMap } = useMapStore();

  const handleClearAll = () => {
    if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
      clearMap();
      clearPCD();
      closeSettingsModal();
    }
  };

  return (
    <Modal
      isOpen={showSettingsModal}
      onClose={closeSettingsModal}
      title="设置"
      size="lg"
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="font-medium text-tahoe-text">点云显示</h3>

          <Slider
            label="目标渲染点数"
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
                onChange={(e) => setConfig({ coloringMode: e.target.value as typeof config.coloringMode })}
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
        </section>

        <section className="space-y-4 pt-4 border-t border-tahoe-border">
          <h3 className="font-medium text-tahoe-text">地面提取</h3>

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
        </section>

        <section className="pt-4 border-t border-tahoe-border">
          <button
            onClick={handleClearAll}
            className="w-full px-4 py-2 bg-tahoe-error text-white rounded-tahoe font-medium hover:bg-red-600 transition-colors"
          >
            清除所有数据
          </button>
          <p className="text-xs text-tahoe-text-secondary mt-2 text-center">
            此操作将清除地图数据和点云，且不可撤销
          </p>
        </section>
      </div>
    </Modal>
  );
}
