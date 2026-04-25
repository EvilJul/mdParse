import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

export function MarkdownEditor({ content, fileName, onContentChange, onClose, onSave, onRename, theme, isMac, fontSize = 16 }: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(fileName);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  }, [onContentChange]);

  // Handle Tab key to insert tab character instead of switching focus
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '\t' + content.substring(end);
      onContentChange(newContent);

      // Set cursor position after tab - use queueMicrotask for more reliable timing
      queueMicrotask(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
    }
  }, [content, onContentChange]);

  // Handle name editing
  const handleNameClick = () => {
    setEditName(fileName);
    setIsEditingName(true);
  };

  const handleNameSubmit = () => {
    const newName = editName.trim() || fileName;
    const finalName = newName.endsWith('.md') ? newName : newName + '.md';
    onRename?.(finalName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSubmit();
    if (e.key === 'Escape') setIsEditingName(false);
  };

  // Theme-aware classes
  const isDark = theme === 'dark';
  const isMacOS = isMac || false;
  const modKey = isMacOS ? '⌘' : 'Ctrl';
  const headerBg = isDark ? 'border-gray-700' : 'border-gray-100';
  const headerText = isDark ? 'text-gray-100' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-400';
  const toggleBg = isDark ? 'bg-gray-700' : 'bg-gray-100';
  const toggleActive = isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm';
  const toggleInactive = isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700';

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 pb-4 border-b ${headerBg}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            {isEditingName ? (
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleNameKeyDown}
                autoFocus
                className={`text-lg font-semibold bg-transparent border-b-2 border-teal-500 outline-none ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              />
            ) : (
              <h2
                className={`text-lg font-semibold ${headerText} cursor-pointer hover:text-teal-400 transition-colors`}
                onClick={handleNameClick}
                title="点击重命名"
              >
                {fileName}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded">编辑中</span>
              <span className={`text-xs ${subText}`}>{content.length} 字符</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className={`flex items-center rounded-lg p-1 ${toggleBg}`}>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'edit' ? toggleActive : toggleInactive
              }`}
            >
              编辑
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'split' ? toggleActive : toggleInactive
              }`}
            >
              分屏
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'preview' ? toggleActive : toggleInactive
              }`}
            >
              预览
            </button>
          </div>

          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
            title={`保存 (${modKey}+S)`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            保存
          </button>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title={`关闭 (${modKey}+W)`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor/Preview Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <textarea
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className={`flex-1 w-full p-4 font-mono border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 ${
                isDark ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200 placeholder-gray-400'
              }`}
              style={{ fontSize: `${fontSize}px` }}
              placeholder="开始编写 Markdown..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-xl p-4`}>
            <MarkdownContent content={content} theme={theme} />
          </div>
        )}
      </div>
    </div>
  );
}

// Markdown Content with copy button
function MarkdownContent({ content, theme }: { content: string; theme: 'light' | 'dark' }) {
  const syntaxStyle = theme === 'dark' ? oneDark : oneLight;
  const isDark = theme === 'dark';

  // Inline styles for guaranteed visibility in dark mode
  const containerStyle: React.CSSProperties = isDark
    ? {
        backgroundColor: '#000000',
        color: '#ffffff',
        padding: '1rem',
        borderRadius: '0.5rem',
      }
    : {
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        padding: '1rem',
        borderRadius: '0.5rem',
      };

  const headingStyle: React.CSSProperties = isDark
    ? { color: '#ffffff', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em' }
    : { color: '#111827', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em' };

  const paragraphStyle: React.CSSProperties = isDark
    ? { color: '#ffffff', lineHeight: '1.75' }
    : { color: '#374151', lineHeight: '1.75' };

  const linkStyle: React.CSSProperties = isDark
    ? { color: '#2dd4bf', textDecoration: 'underline' }
    : { color: '#0d9488', textDecoration: 'underline' };

  const codeStyle: React.CSSProperties = isDark
    ? { color: '#4ade80', backgroundColor: '#1f2937', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontSize: '0.875em' }
    : { color: '#0d9488', backgroundColor: '#f0fdf4', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontSize: '0.875em' };

  const blockquoteStyle: React.CSSProperties = isDark
    ? { borderLeft: '4px solid #2dd4bf', backgroundColor: '#111827', color: '#e5e7eb', padding: '0.5rem 1rem', margin: '1rem 0' }
    : { borderLeft: '4px solid #2dd4bf', backgroundColor: '#f0fdf4', color: '#374151', padding: '0.5rem 1rem', margin: '1rem 0' };

  return (
    <div style={containerStyle}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 style={{ ...headingStyle, fontSize: '2em' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ ...headingStyle, fontSize: '1.5em' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ ...headingStyle, fontSize: '1.25em' }}>{children}</h3>,
          h4: ({ children }) => <h4 style={headingStyle}>{children}</h4>,
          p: ({ children }) => <p style={paragraphStyle}>{children}</p>,
          a: ({ href, children }) => <a href={href} style={linkStyle} target="_blank" rel="noopener noreferrer">{children}</a>,
          strong: ({ children }) => <strong style={{ fontWeight: 'bold', ...(isDark ? { color: '#ffffff' } : { color: '#111827' }) }}>{children}</strong>,
          em: ({ children }) => <em style={isDark ? { color: '#e5e7eb' } : { color: '#4b5563' }}>{children}</em>,
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return <code style={codeStyle}>{children}</code>;
            }

            const codeString = String(children).replace(/\n$/, '');
            const language = match[1] || 'text';

            return (
              <CodeBlock
                code={codeString}
                language={language}
                style={syntaxStyle}
                theme={theme}
              />
            );
          },
          blockquote: ({ children }) => <blockquote style={blockquoteStyle}>{children}</blockquote>,
          ul: ({ children }) => <ul style={isDark ? { color: '#ffffff', paddingLeft: '1.5em' } : { color: '#374151', paddingLeft: '1.5em' }}>{children}</ul>,
          ol: ({ children }) => <ol style={isDark ? { color: '#ffffff', paddingLeft: '1.5em' } : { color: '#374151', paddingLeft: '1.5em' }}>{children}</ol>,
          li: ({ children }) => <li style={isDark ? { color: '#ffffff' } : { color: '#374151' }}>{children}</li>,
          hr: () => <hr style={isDark ? { borderColor: '#374151' } : { borderColor: '#e5e7eb' } } />,
          table: ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>{children}</table>,
          thead: ({ children }) => <thead style={isDark ? { backgroundColor: '#1f2937' } : { backgroundColor: '#f9fafb' }}>{children}</thead>,
          th: ({ children }) => <th style={isDark ? { color: '#ffffff', padding: '0.75rem', borderBottom: '2px solid #374151', textAlign: 'left' } : { color: '#111827', padding: '0.75rem', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>{children}</th>,
          td: ({ children }) => <td style={isDark ? { color: '#ffffff', padding: '0.75rem', borderBottom: '1px solid #374151' } : { color: '#374151', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Code block with copy button
function CodeBlock({ code, language, style, theme }: { code: string; language: string; style: any; theme: 'light' | 'dark' }) {
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className={`absolute top-3 right-3 px-2 py-1 text-xs rounded transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 ${
          isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
      >
        {copied ? (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            已复制
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制
          </span>
        )}
      </button>
      <SyntaxHighlighter
        style={style}
        language={language}
        PreTag="div"
        customStyle={{
          margin: '1em 0',
          borderRadius: '0.75rem',
          fontSize: '0.8125rem',
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}