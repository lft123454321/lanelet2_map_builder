import React from 'react';

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  className = '',
}: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-tahoe-text">{label}</label>
          <span className="text-sm text-tahoe-text-secondary">
            {value.toFixed(step < 1 ? 2 : 0)}{unit}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-tahoe-accent ${className}`}
      />
    </div>
  );
}
