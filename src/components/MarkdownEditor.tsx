import { useState, useRef, useCallback } from 'react';
import { WYSIWYGEditor } from './WYSIWYGEditor';
import type { WYSIWYGEditorHandle } from './WYSIWYGEditor';
import { MarkdownToolbar } from './MarkdownToolbar';
import { OutlinePanel } from './OutlinePanel';

interface MarkdownEditorProps {
  content: string;
  fileName: string;
  onContentChange: (content: string) => void;
  onClose: () => void;
  onSave: () => void;
  onRename?: (newName: string) => void;
  theme: 'light' | 'dark';
  isMac?: boolean;
}

export function MarkdownEditor({
  content,
  fileName,
  onContentChange,
  onClose,
  onSave,
  onRename,
  theme,
  isMac,
}: MarkdownEditorProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(fileName);
  const editorRef = useRef<WYSIWYGEditorHandle>(null);

  const [showOutline, setShowOutline] = useState(false);
  const isDark = theme === 'dark';
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const handleToolbarInsert = useCallback((cmd: string, value?: string) => {
    editorRef.current?.execCommand(cmd, value);
  }, []);

  const handleInsertHTML = useCallback((html: string) => {
    editorRef.current?.execCommand('insertHTML', html);
  }, []);

  const handleNameClick = () => {
    setEditName(fileName);
    setIsEditingName(true);
  };

  const handleNameSubmit = () => {
    const newName = editName.trim() || fileName;
    const finalName = newName.endsWith('.md') ? newName : `${newName}.md`;
    onRename?.(finalName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSubmit();
    if (e.key === 'Escape') setIsEditingName(false);
  };

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-surface-dark text-gray-100' : 'bg-surface text-text'}`}>
      <div className={`flex items-center justify-between px-4 h-11 border-b flex-shrink-0 ${isDark ? 'bg-header-dark border-border-dark' : 'bg-header border-border'}`}>
        <div className="flex items-center gap-2 min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className={`min-w-0 text-xs font-medium border-b border-emerald-500 outline-none px-0.5 py-0.5 ${
                isDark ? 'bg-transparent text-gray-100' : 'bg-transparent text-text'
              }`}
            />
          ) : (
            <h2
              className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-text-secondary'} truncate cursor-default`}
              onDoubleClick={handleNameClick}
              title="双击重命名"
            >
              {fileName}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowOutline(v => !v)}
            className={`p-1 rounded-sm transition-colors ${
              showOutline
                ? isDark ? 'text-emerald-400 bg-gray-700' : 'text-emerald-600 bg-gray-100'
                : isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-sidebar-item-dark' : 'text-text-muted hover:text-text-secondary hover:bg-sidebar'
            }`}
            title="大纲"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>

          <button
            onClick={onSave}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-[11px] rounded-sm transition-colors"
            title={`保存 (${modKey}+S)`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>

          <button
            onClick={onClose}
            className={`p-1 rounded-sm transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-sidebar-item-dark' : 'text-text-muted hover:text-text-secondary hover:bg-sidebar'}`}
            title={`关闭 (${modKey}+W)`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <MarkdownToolbar
        onCommand={handleToolbarInsert}
        onInsertHTML={handleInsertHTML}
        isDark={isDark}
      />

      <div className={`flex-1 flex min-h-0 ${isDark ? 'bg-surface-dark' : 'bg-surface'}`}>
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          <div className="w-full flex-1 flex flex-col px-3">
            <WYSIWYGEditor
              ref={editorRef}
              value={content}
              onChange={onContentChange}
              theme={theme}
            />
          </div>
        </div>
        {showOutline && (
          <OutlinePanel
            content={content}
            theme={theme}
            onScrollToHeading={(index) => {
              editorRef.current?.scrollToHeading(index);
            }}
          />
        )}
      </div>
    </div>
  );
}
