import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

// 亮色与暗色的配色常量，尽量对齐原 contentEditable 版本的视觉。
const light = {
  bg: '#ffffff',
  text: '#374151',
  caret: '#1f2937',
  selection: '#c7f0e9',
  h1: '#111827',
  h2: '#1f2937',
  h3: '#374151',
  h4: '#4b5563',
  headingBorder: '#e5e7eb',
  strong: '#111827',
  link: '#0d9488',
  code: '#0d9488',
  codeBg: '#f3f4f6',
  codeBlockBg: '#f8f9fa',
  codeBlockBorder: '#e5e7eb',
  quoteBorder: '#14b8a6',
  quoteBg: '#f0fdfa',
  quoteText: '#4b5563',
  hr: '#e5e7eb',
  placeholder: '#9ca3af',
  tableBorder: '#e5e7eb',
  tableHeadBg: '#f9fafb',
  tableHeadText: '#6b7280',
  tableBodyBg: '#ffffff',
};

const dark = {
  bg: '#181b22',
  text: '#d1d5db',
  caret: '#e5e7eb',
  selection: '#274b45',
  h1: '#f9fafb',
  h2: '#f3f4f6',
  h3: '#e5e7eb',
  h4: '#d1d5db',
  headingBorder: '#374151',
  strong: '#f9fafb',
  link: '#5eead4',
  code: '#5eead4',
  codeBg: '#1f2937',
  codeBlockBg: '#111827',
  codeBlockBorder: '#374151',
  quoteBorder: '#14b8a6',
  quoteBg: '#1f2937',
  quoteText: '#d1d5db',
  hr: '#374151',
  placeholder: '#6b7280',
  tableBorder: '#374151',
  tableHeadBg: '#1f2937',
  tableHeadText: '#9ca3af',
  tableBodyBg: '#111827',
};

// 根据主题生成 CodeMirror 主题扩展。装饰用到的 class（cm-md-*）在这里统一定义样式。
export function markdownTheme(isDark: boolean): Extension {
  const c = isDark ? dark : light;
  return EditorView.theme(
    {
      '&': {
        color: c.text,
        backgroundColor: c.bg,
        height: '100%',
        fontSize: '16px',
      },
      '.cm-scroller': {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif',
        lineHeight: '1.75',
        overflow: 'auto',
        padding: '1.25rem 0',
      },
      '.cm-content': {
        caretColor: c.caret,
        padding: '0 1.25rem',
        maxWidth: '100%',
      },
      '.cm-line': {
        padding: '0',
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: c.caret,
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        {
          backgroundColor: c.selection,
        },
      '.cm-placeholder': {
        color: c.placeholder,
      },

      // 标题
      '.cm-md-h1': {
        fontSize: '2.25rem',
        fontWeight: '700',
        lineHeight: '1.3',
        color: c.h1,
      },
      '.cm-md-h2': {
        fontSize: '1.875rem',
        fontWeight: '700',
        lineHeight: '1.35',
        color: c.h2,
      },
      '.cm-md-h3': {
        fontSize: '1.5rem',
        fontWeight: '600',
        lineHeight: '1.4',
        color: c.h3,
      },
      '.cm-md-h4': {
        fontSize: '1.25rem',
        fontWeight: '600',
        lineHeight: '1.5',
        color: c.h4,
      },
      '.cm-md-h5': {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: c.h4,
      },
      '.cm-md-h6': {
        fontSize: '1rem',
        fontWeight: '600',
        color: c.h4,
      },

      // 行内标记
      '.cm-md-strong': {
        fontWeight: '700',
        color: c.strong,
      },
      '.cm-md-em': {
        fontStyle: 'italic',
      },
      '.cm-md-strike': {
        textDecoration: 'line-through',
      },
      '.cm-md-code': {
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: '0.875em',
        padding: '0.15em 0.35em',
        borderRadius: '0.25rem',
        background: c.codeBg,
        color: c.code,
        fontWeight: '500',
      },
      '.cm-md-link': {
        color: c.link,
        textDecoration: 'none',
        fontWeight: '500',
        cursor: 'pointer',
      },

      // 引用
      '.cm-md-quote': {
        borderLeft: `4px solid ${c.quoteBorder}`,
        paddingLeft: '1rem',
        background: c.quoteBg,
        color: c.quoteText,
      },

      // 代码块（围栏代码块由 block widget 渲染成 <pre class="cm-md-codeblock"><code>…</code></pre>）
      '.cm-md-codeblock': {
        background: c.codeBlockBg,
        border: `1px solid ${c.codeBlockBorder}`,
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        margin: '0.75rem 0',
        overflowX: 'auto',
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: '0.9em',
        color: c.text,
      },
      '.cm-md-codeblock code': {
        background: 'none',
        padding: '0',
        color: 'inherit',
        fontSize: 'inherit',
      },

      // 分割线（光标不在该行时用小部件替换）
      '.cm-md-hr': {
        display: 'inline-block',
        width: '100%',
        borderTop: `2px solid ${c.hr}`,
        verticalAlign: 'middle',
      },

      // 图片（光标不在该行时用 <img> 替换 ![alt](url)）
      '.cm-md-image': {
        display: 'inline-block',
        verticalAlign: 'bottom',
      },
      '.cm-md-image-el': {
        maxWidth: '100%',
        maxHeight: '480px',
        borderRadius: '0.5rem',
        verticalAlign: 'bottom',
      },
      '.cm-md-image-fallback': {
        padding: '0.1em 0.4em',
        borderRadius: '0.25rem',
        background: c.codeBg,
        color: c.placeholder,
        fontStyle: 'italic',
        fontSize: '0.9em',
      },

      // 表格（光标不在表格区域时用真正的 <table> 整块替换）
      '.cm-md-table': {
        borderCollapse: 'collapse',
        margin: '0.75rem 0',
        width: 'auto',
        maxWidth: '100%',
        border: `1px solid ${c.tableBorder}`,
        borderRadius: '0.5rem',
        fontSize: '0.95em',
        color: c.text,
      },
      '.cm-md-table thead': {
        background: c.tableHeadBg,
      },
      '.cm-md-table tbody': {
        background: c.tableBodyBg,
      },
      '.cm-md-table th, .cm-md-table td': {
        padding: '0.5rem 0.9rem',
        textAlign: 'left',
        border: `1px solid ${c.tableBorder}`,
      },
      '.cm-md-table th': {
        fontWeight: '600',
        fontSize: '0.85em',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: c.tableHeadText,
      },

      // 列表
      '.cm-md-li': {
        paddingLeft: '0.25rem',
      },
      '.cm-md-bullet': {
        display: 'inline-block',
        color: c.quoteBorder,
        fontWeight: '700',
        marginRight: '0.35rem',
      },
      '.cm-md-task': {
        display: 'inline-block',
        marginRight: '0.4rem',
        verticalAlign: 'middle',
      },
      '.cm-md-task-box': {
        cursor: 'default',
        accentColor: c.quoteBorder,
        verticalAlign: 'middle',
        margin: '0',
      },

      // 内嵌 HTML 块（渲染成真实 DOM）
      '.cm-md-htmlblock': {
        margin: '0.5rem 0',
        maxWidth: '100%',
        overflowX: 'auto',
      },
      // 让块内的 table 也套用与 markdown 表格一致的观感。
      '.cm-md-htmlblock table': {
        borderCollapse: 'collapse',
        border: `1px solid ${c.tableBorder}`,
      },
      '.cm-md-htmlblock th, .cm-md-htmlblock td': {
        padding: '0.4rem 0.75rem',
        border: `1px solid ${c.tableBorder}`,
        verticalAlign: 'top',
      },
      '.cm-md-htmlblock th': {
        background: c.tableHeadBg,
        color: c.tableHeadText,
      },
      '.cm-md-htmlblock a': {
        color: c.link,
        textDecoration: 'none',
      },
      '.cm-md-htmlblock strong': {
        color: c.strong,
        fontWeight: '700',
      },
      '.cm-md-htmlblock img': {
        maxWidth: '100%',
        height: 'auto',
      },
      // 行内 HTML
      '.cm-md-htmlinline a': {
        color: c.link,
        textDecoration: 'none',
      },
      '.cm-md-htmlinline strong': {
        color: c.strong,
        fontWeight: '700',
      },
    },
    { dark: isDark }
  );
}
