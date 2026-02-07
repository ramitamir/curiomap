'use client';

import { useState, useRef, useEffect } from 'react';
import { Axis } from '@/lib/types';

interface AxisConfiguratorProps {
  xAxis: Axis;
  yAxis: Axis;
  onAxisUpdate: (axis: 'x' | 'y', updates: Partial<Axis>) => void;
}

interface EditableLabelProps {
  value: string;
  onChange: (value: string) => void;
  position: 'top' | 'bottom' | 'left' | 'right';
}

function EditableLabel({ value, onChange, position }: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (localValue.trim()) {
      onChange(localValue.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  const positionStyles = {
    top: 'text-center mb-2',
    bottom: 'text-center mt-2',
    left: 'text-right mr-2',
    right: 'text-left ml-2',
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={`font-mono text-sm bg-white border border-black px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black ${
          position === 'left' || position === 'right' ? 'w-48' : 'w-64'
        }`}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`font-mono text-sm cursor-pointer hover:bg-white/50 px-2 py-1 transition-colors ${positionStyles[position]}`}
    >
      {value}
    </div>
  );
}

export default function AxisConfigurator({
  xAxis,
  yAxis,
  onAxisUpdate,
}: AxisConfiguratorProps) {
  return (
    <div className="relative">
      {/* These components are invisible - they're just for state management */}
      {/* The actual labels are rendered within the CurioGrid canvas component */}
      <div className="hidden">
        <EditableLabel
          value={xAxis.minLabel}
          onChange={(value) => onAxisUpdate('x', { minLabel: value })}
          position="left"
        />
        <EditableLabel
          value={xAxis.maxLabel}
          onChange={(value) => onAxisUpdate('x', { maxLabel: value })}
          position="right"
        />
        <EditableLabel
          value={yAxis.minLabel}
          onChange={(value) => onAxisUpdate('y', { minLabel: value })}
          position="bottom"
        />
        <EditableLabel
          value={yAxis.maxLabel}
          onChange={(value) => onAxisUpdate('y', { maxLabel: value })}
          position="top"
        />
      </div>
    </div>
  );
}
