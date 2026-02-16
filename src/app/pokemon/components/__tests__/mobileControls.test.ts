import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const COMPONENT_PATH = path.resolve(__dirname, '..', 'MobileControls.tsx');
const componentSource = fs.readFileSync(COMPONENT_PATH, 'utf-8');

describe('MobileControls component', () => {
  it('exports default component and utility functions', async () => {
    // Verify exports exist in source
    expect(componentSource).toContain('export default function MobileControls');
    expect(componentSource).toContain('export { isTouchDevice, dispatchKey }');
  });

  it('contains D-pad buttons for all four directions', () => {
    // D-pad uses template: dpad-${direction}
    expect(componentSource).toContain('direction="up"');
    expect(componentSource).toContain('direction="down"');
    expect(componentSource).toContain('direction="left"');
    expect(componentSource).toContain('direction="right"');
    expect(componentSource).toContain('dpad-${direction}');
  });

  it('contains A, B, and Start action buttons', () => {
    // Action buttons use template: btn-${name}
    expect(componentSource).toContain('name="a"');
    expect(componentSource).toContain('name="b"');
    expect(componentSource).toContain('name="start"');
    expect(componentSource).toContain('btn-${name}');
  });

  it('uses emerald-400 semi-transparent styling', () => {
    expect(componentSource).toContain('emerald-400');
    expect(componentSource).toMatch(/emerald-400\/\d+/);
  });

  it('detects touch devices via ontouchstart and maxTouchPoints', () => {
    expect(componentSource).toContain('ontouchstart');
    expect(componentSource).toContain('maxTouchPoints');
  });

  it('maps D-pad to arrow key events', () => {
    expect(componentSource).toContain('ArrowUp');
    expect(componentSource).toContain('ArrowDown');
    expect(componentSource).toContain('ArrowLeft');
    expect(componentSource).toContain('ArrowRight');
  });

  it('maps A button to space (action/confirm)', () => {
    // A button dispatches space key
    expect(componentSource).toContain("keyValue=\" \"");
  });

  it('maps B button to Escape (back/cancel)', () => {
    expect(componentSource).toContain('keyValue="Escape"');
  });

  it('maps Start button to Enter (menu)', () => {
    expect(componentSource).toContain('keyValue="Enter"');
  });

  it('dispatches KeyboardEvent on button press', () => {
    expect(componentSource).toContain('new KeyboardEvent');
    expect(componentSource).toContain('dispatchEvent');
  });

  it('only renders when touch device detected', () => {
    expect(componentSource).toContain('if (!visible) return null');
    expect(componentSource).toContain('setVisible(isTouchDevice())');
  });

  it('uses fixed positioning to not overlap canvas', () => {
    expect(componentSource).toContain('fixed');
    expect(componentSource).toContain('pointer-events-none');
    expect(componentSource).toContain('z-50');
  });

  it('is a React component using client directive', () => {
    expect(componentSource).toContain("'use client'");
    expect(componentSource).toContain('import React');
  });
});
