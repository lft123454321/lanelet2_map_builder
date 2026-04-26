import React, { useState } from 'react';
import { Gear, Keyboard } from '@phosphor-icons/react';
import { useUIStore } from '../../store/uiStore';
import { usePCDStore } from '../../store/pcdStore';

export function Header() {
  const { openSettingsModal } = useUIStore();
  const { isLoaded: pcdLoaded } = usePCDStore();

  return (
    <header className="h-10 bg-tahoe-surface border-b border-tahoe-border flex items-center justify-between px-3 z-20">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-tahoe-text">Lanelet2 Map Editor</span>
        {!pcdLoaded && (
          <span className="text-xs text-tahoe-text-secondary bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
            未加载点云
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={openSettingsModal}
          className="p-2 rounded hover:bg-tahoe-bg-hover text-tahoe-text-secondary transition-colors"
          title="设置"
        >
          <Gear size={18} />
        </button>
      </div>
    </header>
  );
}