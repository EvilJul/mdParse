import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

function createOptions(overrides: Partial<Parameters<typeof useKeyboardShortcuts>[0]> = {}) {
  return {
    onNewFile: vi.fn(),
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onOpenFile: vi.fn(),
    onOpenFolder: vi.fn(),
    onCloseFile: vi.fn(),
    onToggleTheme: vi.fn(),
    onShowShortcuts: vi.fn(),
    ...overrides,
  };
}

describe('useKeyboardShortcuts', () => {
  it('registers and cleans up event listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useKeyboardShortcuts(createOptions())
    );

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('calls onNewFile on Ctrl+N', () => {
    const onNewFile = vi.fn();
    renderHook(() => useKeyboardShortcuts(createOptions({ onNewFile })));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }));
    expect(onNewFile).toHaveBeenCalledTimes(1);
  });

  it('calls onSave on Ctrl+S', () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts(createOptions({ onSave })));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onSaveAs on Ctrl+Shift+S', () => {
    const onSaveAs = vi.fn();
    renderHook(() => useKeyboardShortcuts(createOptions({ onSaveAs })));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, shiftKey: true }));
    expect(onSaveAs).toHaveBeenCalledTimes(1);
  });

  it('calls onCloseFile on Ctrl+W', () => {
    const onCloseFile = vi.fn();
    renderHook(() => useKeyboardShortcuts(createOptions({ onCloseFile })));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', ctrlKey: true }));
    expect(onCloseFile).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleTheme on Ctrl+Shift+T', () => {
    const onToggleTheme = vi.fn();
    renderHook(() => useKeyboardShortcuts(createOptions({ onToggleTheme })));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'T', ctrlKey: true, shiftKey: true }));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('calls onShowShortcuts on Ctrl+?', () => {
    const onShowShortcuts = vi.fn();
    renderHook(() => useKeyboardShortcuts(createOptions({ onShowShortcuts })));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', ctrlKey: true }));
    expect(onShowShortcuts).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenFile on Ctrl+O', () => {
    const onOpenFile = vi.fn();
    renderHook(() => useKeyboardShortcuts(createOptions({ onOpenFile })));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', ctrlKey: true }));
    expect(onOpenFile).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenFolder on Ctrl+Shift+O', () => {
    const onOpenFolder = vi.fn();
    renderHook(() => useKeyboardShortcuts(createOptions({ onOpenFolder })));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', ctrlKey: true, shiftKey: true }));
    expect(onOpenFolder).toHaveBeenCalledTimes(1);
  });
});
