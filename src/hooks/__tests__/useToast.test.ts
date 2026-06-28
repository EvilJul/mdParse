import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toHaveLength(0);
  });

  it('adds a success toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.success('操作成功'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('操作成功');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('adds an error toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.error('操作失败'));
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('adds an info toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.info('提示信息'));
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('removes a toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.success('test'));
    const id = result.current.toasts[0].id;
    act(() => result.current.removeToast(id));
    expect(result.current.toasts).toHaveLength(0);
  });

  it('auto-generates unique IDs', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('a');
      result.current.error('b');
      result.current.info('c');
    });
    const ids = result.current.toasts.map(t => t.id);
    expect(new Set(ids).size).toBe(3);
  });
});
