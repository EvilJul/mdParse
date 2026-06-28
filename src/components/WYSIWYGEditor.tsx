import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';

marked.use({ gfm: true, breaks: false });

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
});

export interface WYSIWYGEditorHandle {
  execCommand: (cmd: string, value?: string) => void;
  focus: () => void;
}

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
  placeholder?: string;
}

export const WYSIWYGEditor = forwardRef<WYSIWYGEditorHandle, WYSIWYGEditorProps>(
  function WYSIWYGEditor({ value, onChange, theme, placeholder }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isRendering = useRef(false);
    const isLocalSync = useRef(false);
    const onChangeRef = useRef(onChange);
    const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    const restoreCursor = useCallback((offset: number) => {
      const container = containerRef.current;
      if (!container || offset < 0) return;
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let charCount = 0;
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        const len = node.textContent?.length ?? 0;
        if (charCount + len >= offset) {
          const pos = Math.min(Math.max(0, offset - charCount), len);
          try {
            const range = document.createRange();
            range.setStart(node, pos);
            range.collapse(true);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } catch {}
          return;
        }
        charCount += len;
      }
    }, []);

    const saveCursor = useCallback((): number => {
      const container = containerRef.current;
      const sel = window.getSelection();
      if (!container || !sel || !sel.rangeCount) return -1;
      const range = sel.getRangeAt(0);
      const preRange = document.createRange();
      preRange.selectNodeContents(container);
      preRange.setEnd(range.endContainer, range.endOffset);
      return preRange.toString().length;
    }, []);

    const renderMarkdown = useCallback((md: string, cursorOffset = -1) => {
      const container = containerRef.current;
      if (!container) return;
      isRendering.current = true;
      const html = marked.parse(md || '') as string;
      container.innerHTML = html;
      isRendering.current = false;
      if (cursorOffset >= 0) restoreCursor(cursorOffset);
    }, [restoreCursor]);

    useEffect(() => {
      renderMarkdown(value);
    }, []);

    useEffect(() => {
      if (isLocalSync.current) {
        isLocalSync.current = false;
        return;
      }
      const offset = saveCursor();
      renderMarkdown(value, offset);
    }, [value, saveCursor, renderMarkdown]);

    const syncToMarkdown = useCallback(() => {
      const container = containerRef.current;
      if (!container || isRendering.current) return;
      const md = turndownService.turndown(container.innerHTML);
      isLocalSync.current = true;
      onChangeRef.current(md);
    }, []);

    const handleInput = useCallback(() => {
      if (isRendering.current) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(syncToMarkdown, 800);
    }, [syncToMarkdown]);

    const handleBlur = useCallback(() => {
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
        syncTimer.current = null;
      }
      syncToMarkdown();
    }, [syncToMarkdown]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
      document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'k':
          e.preventDefault();
          const url = window.prompt('链接地址:');
          if (url) document.execCommand('createLink', false, url);
          break;
      }
    }, []);

    useImperativeHandle(ref, () => ({
      execCommand(cmd: string, value?: string) {
        document.execCommand(cmd, false, value);
        containerRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
      },
      focus() {
        containerRef.current?.focus();
      },
    }));

    return (
      <>
        <style key={`theme-${isDark ? 'dark' : 'light'}`}>{`
          .wysiwyg-editor {
            padding: 1.25rem;
            font-size: 16px;
            line-height: 1.75;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;
            color: ${isDark ? '#d1d5db' : '#374151'};
            background-color: ${isDark ? '#181b22' : '#ffffff'};
            caret-color: ${isDark ? '#e5e7eb' : '#1f2937'};
            outline: none;
            overflow: auto;
            width: 100%;
            height: 100%;
          }
          .wysiwyg-editor:empty:before {
            content: attr(data-placeholder);
            color: ${isDark ? '#6b7280' : '#9ca3af'};
            pointer-events: none;
          }
          .wysiwyg-editor h1 {
            font-size: 2.25rem;
            font-weight: 700;
            line-height: 1.2;
            margin-top: 2rem;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid ${isDark ? '#374151' : '#e5e7eb'};
            color: ${isDark ? '#f9fafb' : '#111827'};
          }
          .wysiwyg-editor h2 {
            font-size: 1.875rem;
            font-weight: 700;
            line-height: 1.3;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            color: ${isDark ? '#f3f4f6' : '#1f2937'};
          }
          .wysiwyg-editor h3 {
            font-size: 1.5rem;
            font-weight: 600;
            line-height: 1.4;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: ${isDark ? '#e5e7eb' : '#374151'};
          }
          .wysiwyg-editor h4 {
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.5;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: ${isDark ? '#d1d5db' : '#4b5563'};
          }
          .wysiwyg-editor p {
            margin-top: 0;
            margin-bottom: 1.25rem;
            line-height: 1.75;
            min-height: 1.75em;
          }
          .wysiwyg-editor a {
            color: ${isDark ? '#5eead4' : '#0d9488'};
            text-decoration: none;
            font-weight: 500;
          }
          .wysiwyg-editor a:hover {
            text-decoration: underline;
          }
          .wysiwyg-editor strong {
            font-weight: 700;
            color: ${isDark ? '#f9fafb' : '#111827'};
          }
          .wysiwyg-editor em {
            font-style: italic;
          }
          .wysiwyg-editor code {
            font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.875em;
            padding: 0.2em 0.4em;
            border-radius: 0.25rem;
            background: ${isDark ? '#1f2937' : '#f3f4f6'};
            color: ${isDark ? '#5eead4' : '#0d9488'};
            font-weight: 500;
          }
          .wysiwyg-editor pre {
            margin: 1.5rem 0;
            padding: 1rem 1.25rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            background: ${isDark ? '#111827' : '#f8f9fa'};
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          }
          .wysiwyg-editor pre code {
            background: none;
            padding: 0;
            color: ${isDark ? '#e5e7eb' : '#374151'};
            font-size: 0.875rem;
            line-height: 1.6;
          }
          .wysiwyg-editor blockquote {
            margin: 1.5rem 0;
            padding: 1rem 1.5rem;
            border-left: 4px solid #14b8a6;
            background: ${isDark ? '#1f2937' : '#f0fdfa'};
            border-radius: 0 0.5rem 0.5rem 0;
            color: ${isDark ? '#d1d5db' : '#4b5563'};
          }
          .wysiwyg-editor blockquote p {
            margin: 0.5rem 0;
          }
          .wysiwyg-editor ul, .wysiwyg-editor ol {
            margin: 1rem 0;
            padding-left: 1.75rem;
          }
          .wysiwyg-editor li {
            margin: 0.5rem 0;
            line-height: 1.75;
          }
          .wysiwyg-editor hr {
            margin: 2.5rem 0;
            border: 0;
            border-top: 2px solid ${isDark ? '#374151' : '#e5e7eb'};
          }
          .wysiwyg-editor img {
            max-width: 100%;
            margin: 1.5rem 0;
            border-radius: 0.5rem;
          }
          .wysiwyg-editor table {
            width: 100%;
            border-collapse: collapse;
            margin: 2rem 0;
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
            border-radius: 0.5rem;
            overflow: hidden;
          }
          .wysiwyg-editor thead {
            background: ${isDark ? '#1f2937' : '#f9fafb'};
          }
          .wysiwyg-editor tbody {
            background: ${isDark ? '#111827' : '#ffffff'};
          }
          .wysiwyg-editor th, .wysiwyg-editor td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          }
          .wysiwyg-editor th {
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: ${isDark ? '#9ca3af' : '#6b7280'};
          }
          .wysiwyg-editor tbody tr:last-child td {
            border-bottom: none;
          }
        `}</style>
        <div
          ref={containerRef}
          contentEditable
          suppressContentEditableWarning
          className="wysiwyg-editor"
          data-placeholder={placeholder || '开始编写 Markdown...'}
          onInput={handleInput}
          onBlur={handleBlur}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        />
      </>
    );
  }
);
