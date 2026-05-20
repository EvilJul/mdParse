import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onNewFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onCloseFile: () => void;
  onToggleTheme: () => void;
  onShowSearch: () => void;
  onShowShortcuts: () => void;
  onInsertBold?: () => void;
  onInsertItalic?: () => void;
  onInsertLink?: () => void;
  onInsertCode?: () => void;
  onInsertHeading?: (level: number) => void;
  isInputFocused?: boolean;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，只允许 Escape 键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      if (!isMod) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          options.onNewFile();
          break;
        case 's':
          e.preventDefault();
          if (e.shiftKey) {
            options.onSaveAs();
          } else {
            options.onSave();
          }
          break;
        case 'o':
          e.preventDefault();
          if (e.shiftKey) {
            options.onOpenFolder();
          } else {
            options.onOpenFile();
          }
          break;
        case 'w':
          e.preventDefault();
          options.onCloseFile();
          break;
        case 'f':
        case 'h':
          e.preventDefault();
          options.onShowSearch();
          break;
        case 't':
          if (e.shiftKey) {
            e.preventDefault();
            options.onToggleTheme();
          }
          break;
        case '?':
          e.preventDefault();
          options.onShowShortcuts();
          break;
        case 'b':
          if (options.onInsertBold) {
            e.preventDefault();
            options.onInsertBold();
          }
          break;
        case 'i':
          if (options.onInsertItalic) {
            e.preventDefault();
            options.onInsertItalic();
          }
          break;
        case 'k':
          if (options.onInsertLink) {
            e.preventDefault();
            options.onInsertLink();
          }
          break;
        case '`':
          if (options.onInsertCode) {
            e.preventDefault();
            options.onInsertCode();
          }
          break;
        case '1':
        case '2':
        case '3':
          if (options.onInsertHeading) {
            e.preventDefault();
            options.onInsertHeading(parseInt(e.key));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
