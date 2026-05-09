interface MarkdownToolbarProps {
  onInsert: (before: string, after?: string) => void;
  isDark: boolean;
}

export function MarkdownToolbar({ onInsert, isDark }: MarkdownToolbarProps) {
  const tools = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 6l12 12" />
        </svg>
      ),
      label: '加粗',
      action: () => onInsert('**', '**'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="19" y1="4" x2="10" y2="4" strokeWidth={2} strokeLinecap="round" transform="rotate(15 14.5 4)" />
        </svg>
      ),
      label: '斜体',
      action: () => onInsert('*', '*'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      label: '链接',
      action: () => onInsert('[', '](url)'),
      shortcut: 'Ctrl+K'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: '图片',
      action: () => onInsert('![', '](url)'),
      shortcut: ''
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: '代码',
      action: () => onInsert('`', '`'),
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
      action: () => onInsert('\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n', ''),
      shortcut: ''
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      label: '无序列表',
      action: () => onInsert('\n- ', ''),
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
      action: () => onInsert('\n1. ', ''),
      shortcut: ''
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      label: '引用',
      action: () => onInsert('\n> ', ''),
      shortcut: ''
    },
    {
      icon: <span className="text-lg font-bold">H1</span>,
      label: '标题1',
      action: () => onInsert('\n# ', ''),
      shortcut: 'Ctrl+1'
    },
    {
      icon: <span className="text-base font-bold">H2</span>,
      label: '标题2',
      action: () => onInsert('\n## ', ''),
      shortcut: 'Ctrl+2'
    },
    {
      icon: <span className="text-sm font-bold">H3</span>,
      label: '标题3',
      action: () => onInsert('\n### ', ''),
      shortcut: 'Ctrl+3'
    },
  ];

  return (
    <div className={`flex items-center gap-1 px-3 py-2 border-b ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/80 border-gray-200'}`}>
      <div className="flex items-center gap-0.5 flex-wrap">
        {tools.map((tool, index) => (
          <button
            key={index}
            onClick={tool.action}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-white text-gray-600 hover:text-gray-900 hover:shadow-sm'
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
