interface MarkdownToolbarProps {
  onCommand: (cmd: string, value?: string) => void;
  onInsertHTML?: (html: string) => void;
  isDark: boolean;
}

export function MarkdownToolbar({ onCommand, onInsertHTML, isDark }: MarkdownToolbarProps) {
  const tools = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 6l12 12" />
        </svg>
      ),
      label: '加粗',
      action: () => onCommand('bold'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="19" y1="4" x2="10" y2="4" strokeWidth={2} strokeLinecap="round" transform="rotate(15 14.5 4)" />
        </svg>
      ),
      label: '斜体',
      action: () => onCommand('italic'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      label: '链接',
      action: () => {
        const url = window.prompt('链接地址:');
        if (url) onCommand('createLink', url);
      },
      shortcut: 'Ctrl+K'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: '图片',
      action: () => {
        const url = window.prompt('图片地址:');
        if (url) onInsertHTML?.(`<img src="${url}" alt="image" />`);
      },
      shortcut: ''
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: '代码',
      action: () => onInsertHTML?.('<code>代码</code>'),
      shortcut: 'Ctrl+`'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M9 3v18" />
        </svg>
      ),
      label: '表格',
      action: () => onInsertHTML?.(
        '<table><thead><tr><th>列1</th><th>列2</th><th>列3</th></tr></thead><tbody><tr><td>内容</td><td>内容</td><td>内容</td></tr></tbody></table>'
      ),
      shortcut: ''
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      label: '无序列表',
      action: () => onCommand('insertUnorderedList'),
      shortcut: ''
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
          <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
          <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
        </svg>
      ),
      label: '有序列表',
      action: () => onCommand('insertOrderedList'),
      shortcut: ''
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      label: '引用',
      action: () => onCommand('formatBlock', '<blockquote>'),
      shortcut: ''
    },
    {
      icon: <span className="text-lg font-bold">H1</span>,
      label: '标题1',
      action: () => onCommand('formatBlock', '<h1>'),
      shortcut: 'Ctrl+1'
    },
    {
      icon: <span className="text-base font-bold">H2</span>,
      label: '标题2',
      action: () => onCommand('formatBlock', '<h2>'),
      shortcut: 'Ctrl+2'
    },
    {
      icon: <span className="text-sm font-bold">H3</span>,
      label: '标题3',
      action: () => onCommand('formatBlock', '<h3>'),
      shortcut: 'Ctrl+3'
    },
  ];

  return (
    <div className={`flex items-center gap-0.5 px-3 h-9 border-b flex-shrink-0 ${isDark ? 'bg-header-dark border-border-dark' : 'bg-header border-border'}`}>
      <div className="flex items-center gap-0.5">
        {tools.map((tool, index) => (
          <button
            key={index}
            onClick={tool.action}
            className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors ${
              isDark 
                ? 'text-gray-500 hover:text-gray-300 hover:bg-sidebar-item-dark' 
                : 'text-text-muted hover:text-text-secondary hover:bg-sidebar'
            }`}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
