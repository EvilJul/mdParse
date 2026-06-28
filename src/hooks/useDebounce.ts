import { useEffect, useRef } from 'react';
import type React from 'react';

/**
 * 防抖 Hook - 延迟执行回调函数
 * @param callback 要执行的回调函数
 * @param delay 延迟时间（毫秒）
 * @param dependencies 依赖数组
 */
export function useDebounce(callback: () => void, delay: number, dependencies: React.DependencyList) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = window.setTimeout(() => {
      callback();
    }, delay);

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * 防抖 localStorage 写入 Hook
 * @param key localStorage 键名
 * @param value 要存储的值
 * @param delay 延迟时间（毫秒），默认 1000ms
 */
export function useDebouncedLocalStorage<T>(key: string, value: T, delay: number = 1000) {
  useDebounce(
    () => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Failed to save to localStorage (${key}):`, error);
      }
    },
    delay,
    [key, value]
  );
}
