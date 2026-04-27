import { useState, useEffect } from 'react';
import type { ThemeType } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('mdparse-theme');
    return (saved as ThemeType) || 'light';
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('mdparse-font-size');
    return saved ? parseInt(saved) : 16;
  });

  useEffect(() => {
    localStorage.setItem('mdparse-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mdparse-font-size', fontSize.toString());
  }, [fontSize]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';

  return {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    toggleTheme,
    isDark
  };
}
