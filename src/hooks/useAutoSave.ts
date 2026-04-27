import { useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  enabled: boolean;
  interval?: number; // 毫秒
  onSave: () => Promise<void> | void;
}

export function useAutoSave({ enabled, interval = 30000, onSave }: UseAutoSaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = window.setInterval(async () => {
      setIsSaving(true);
      try {
        await onSave();
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, interval, onSave]);

  return { lastSaved, isSaving };
}
