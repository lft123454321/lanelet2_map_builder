import { useCallback, useState } from 'react';
import { CloudArrowUp, Spinner } from '@phosphor-icons/react';
import { Modal, Button } from '../ui';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { parseOSM } from '../../utils/lanelet2';

export function ImportOSMModal() {
  const { showImportOSMModal, closeImportOSMModal } = useUIStore();
  const { loadMap } = useMapStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.osm') && !file.name.endsWith('.xml')) {
      alert('请选择 OSM 文件');
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      const data = parseOSM(text);
      loadMap(data);
      closeImportOSMModal();
    } catch (error) {
      console.error('Failed to load OSM:', error);
      alert('加载 OSM 文件失败');
    } finally {
      setIsLoading(false);
    }
  }, [loadMap, closeImportOSMModal]);

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
      isOpen={showImportOSMModal}
      onClose={closeImportOSMModal}
      title="导入 Lanelet2 (OSM)"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={closeImportOSMModal}>
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
            拖拽 OSM 文件到这里
          </p>
          <p className="text-sm text-tahoe-text-secondary mb-4">
            或
          </p>
          <label className="btn-primary inline-block cursor-pointer">
            选择文件
            <input
              type="file"
              accept=".osm,.xml"
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
              正在解析...
            </p>
          </div>
        )}

        <p className="text-xs text-tahoe-text-secondary text-center">
          支持 Lanelet2 格式的 OSM XML 文件，包含点、线串、车道和交通规则元素。
        </p>
      </div>
    </Modal>
  );
}
