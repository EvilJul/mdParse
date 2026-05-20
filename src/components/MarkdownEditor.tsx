import { useState, useCallback, useRef } from 'react';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownContent } from './MarkdownContent';

interface MarkdownEditorProps {
  content: string;
  fileName: string;
  onContentChange: (content: string) => void;
  onClose: () => void;
  onSave: () => void;
  onRename?: (newName: string) => void;
  theme: 'light' | 'dark';
  isMac?: boolean;
  fontSize?: number;
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
  fontSize = 16
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(fileName);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark = theme === 'dark';
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  }, [onContentChange]);

  const handleToolbarInsert = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || '文本';
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);

    onContentChange(newContent);

    queueMicrotask(() => {
      const newPosition = start + before.length + selectedText.length + after.length;
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    });
  }, [content, onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '\t' + content.substring(end);

      onContentChange(newContent);

      queueMicrotask(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
    }
  }, [content, onContentChange]);

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

  const headerText = isDark ? 'text-gray-100' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const toggleBg = isDark ? 'bg-gray-700' : 'bg-gray-100';
  const toggleActive = isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm';
  const toggleInactive = isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700';

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`flex items-center justify-between px-6 py-3 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-3 min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className={`min-w-0 text-base font-semibold border-b-2 border-emerald-500 outline-none px-1 ${
                isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}
            />
          ) : (
            <h2
              className={`text-base font-semibold ${headerText} cursor-pointer hover:text-emerald-500 transition-colors duration-200 truncate`}
              onClick={handleNameClick}
              title="点击重命名"
            >
              {fileName}
            </h2>
          )}
          <span className={`text-xs ${subText} flex-shrink-0`}>{content.length} 字符</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`flex items-center rounded-lg p-0.5 ${toggleBg}`}>
            {[
              ['edit', '编辑'],
              ['split', '分屏'],
              ['preview', '预览']
            ].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as 'edit' | 'preview' | 'split')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  viewMode === mode ? toggleActive : toggleInactive
                }`}
                title={`${label}模式`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
            title={`保存 (${modKey}+S)`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存
          </button>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors duration-200 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title={`关闭 (${modKey}+W)`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {(viewMode === 'edit' || viewMode === 'split') && (
        <MarkdownToolbar onInsert={handleToolbarInsert} isDark={isDark} />
      )}

      <div className={`flex-1 flex gap-4 min-h-0 p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col min-w-0`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className={`flex-1 w-full p-5 font-mono border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm ${
                isDark ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500' : 'bg-white text-gray-800 border-gray-200 placeholder-gray-400'
              }`}
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
              placeholder="开始编写 Markdown..."
              spellCheck={false}
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} min-w-0 overflow-auto ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <MarkdownContent content={content} theme={theme} />
          </div>
        )}
      </div>
    </div>
  );
}
