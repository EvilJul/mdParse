import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useThemeContext } from '../ThemeContext';

describe('ThemeContext', () => {
  it('provides default theme as light', () => {
    const { result } = renderHook(() => useThemeContext(), {
      wrapper: ThemeProvider,
    });
    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('toggles theme between light and dark', () => {
    const { result } = renderHook(() => useThemeContext(), {
      wrapper: ThemeProvider,
    });

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('sets theme explicitly', () => {
    const { result } = renderHook(() => useThemeContext(), {
      wrapper: ThemeProvider,
    });

    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');

    act(() => result.current.setTheme('light'));
    expect(result.current.theme).toBe('light');
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useThemeContext())).toThrow(
      'useThemeContext must be used within ThemeProvider'
    );
  });

  it('sets font size', () => {
    const { result } = renderHook(() => useThemeContext(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.fontSize).toBe(16);

    act(() => result.current.setFontSize(20));
    expect(result.current.fontSize).toBe(20);
  });
});
