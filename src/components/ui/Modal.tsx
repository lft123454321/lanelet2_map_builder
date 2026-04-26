import React, { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`panel w-full ${sizeClasses[size]} mx-4 max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-tahoe-border">
          <h2 className="text-lg font-semibold text-tahoe-text">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!p-1">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-tahoe-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
