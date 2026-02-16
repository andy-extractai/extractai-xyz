'use client';

import React, { useEffect, useState, useCallback } from 'react';

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function dispatchKey(key: string, type: 'keydown' | 'keyup' = 'keydown') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
}

interface DPadButtonProps {
  direction: string;
  keyValue: string;
  label: string;
  className?: string;
}

function DPadButton({ direction, keyValue, label, className = '' }: DPadButtonProps) {
  const handlePress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    dispatchKey(keyValue);
  }, [keyValue]);

  const handleRelease = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    dispatchKey(keyValue, 'keyup');
  }, [keyValue]);

  return (
    <button
      data-testid={`dpad-${direction}`}
      className={`bg-emerald-400/50 active:bg-emerald-400/80 border-2 border-emerald-400/70 
        text-white font-mono text-lg select-none rounded-sm w-12 h-12 flex items-center justify-center ${className}`}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      aria-label={direction}
    >
      {label}
    </button>
  );
}

interface ActionButtonProps {
  name: string;
  keyValue: string;
  label: string;
  size?: string;
}

function ActionButton({ name, keyValue, label, size = 'w-14 h-14 rounded-full' }: ActionButtonProps) {
  const handlePress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    dispatchKey(keyValue);
  }, [keyValue]);

  return (
    <button
      data-testid={`btn-${name}`}
      className={`bg-emerald-400/50 active:bg-emerald-400/80 border-2 border-emerald-400/70 
        text-white font-mono font-bold select-none flex items-center justify-center ${size}`}
      onTouchStart={handlePress}
      onMouseDown={handlePress}
      aria-label={name}
    >
      {label}
    </button>
  );
}

export default function MobileControls() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isTouchDevice());
  }, []);

  if (!visible) return null;

  return (
    <div data-testid="mobile-controls" className="fixed inset-x-0 bottom-0 pointer-events-none z-50" style={{ height: '200px' }}>
      {/* Start button - top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto">
        <ActionButton name="start" keyValue="Enter" label="START" size="w-20 h-8 rounded-sm text-xs" />
      </div>

      {/* D-pad - bottom left */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="grid grid-cols-3 gap-1 w-[152px]">
          <div />
          <DPadButton direction="up" keyValue="ArrowUp" label="▲" />
          <div />
          <DPadButton direction="left" keyValue="ArrowLeft" label="◀" />
          <div className="w-12 h-12" />
          <DPadButton direction="right" keyValue="ArrowRight" label="▶" />
          <div />
          <DPadButton direction="down" keyValue="ArrowDown" label="▼" />
          <div />
        </div>
      </div>

      {/* A and B buttons - bottom right */}
      <div className="absolute bottom-8 right-4 pointer-events-auto flex gap-3 items-end">
        <ActionButton name="b" keyValue="Escape" label="B" />
        <div className="mb-6">
          <ActionButton name="a" keyValue=" " label="A" />
        </div>
      </div>
    </div>
  );
}

export { isTouchDevice, dispatchKey };
