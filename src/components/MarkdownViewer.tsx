import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownViewerProps {
  content: string;
  fileName: string;
  onClear: () => void;
}

export function MarkdownViewer({ content, fileName, onClear }: MarkdownViewerProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{fileName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">Markdown</span>
              <span className="text-xs text-gray-400">{content.length} 字符</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClear}
          className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          title="关闭文件"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <style>{`
          /* 全局样式 */
          .prose {
            color: #374151;
            line-height: 1.75;
          }

          /* 标题样式 */
          .prose h1 {
            font-size: 2.25rem;
            font-weight: 700;
            line-height: 1.2;
            margin-top: 2rem;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #e5e7eb;
            color: #111827;
          }
          .prose h2 {
            font-size: 1.875rem;
            font-weight: 700;
            line-height: 1.3;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            color: #1f2937;
          }
          .prose h3 {
            font-size: 1.5rem;
            font-weight: 600;
            line-height: 1.4;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #374151;
          }
          .prose h4 {
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.5;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: #4b5563;
          }
          .prose h5, .prose h6 {
            font-size: 1.125rem;
            font-weight: 600;
            line-height: 1.5;
            margin-top: 1.25rem;
            margin-bottom: 0.5rem;
            color: #4b5563;
          }

          /* 段落 */
          .prose p {
            margin-top: 0;
            margin-bottom: 1.25rem;
            line-height: 1.75;
            color: #4b5563;
          }

          /* 链接 */
          .prose a {
            color: #0d9488;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
          }
          .prose a:hover {
            color: #0f766e;
            text-decoration: underline;
          }

          /* 强调 */
          .prose strong {
            font-weight: 700;
            color: #111827;
          }
          .prose em {
            font-style: italic;
            color: #374151;
          }
          .prose del {
            text-decoration: line-through;
            opacity: 0.6;
          }

          /* 内联代码 */
          .prose code {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.875em;
            padding: 0.2em 0.4em;
            border-radius: 0.25rem;
            background: #f3f4f6;
            color: #0d9488;
            font-weight: 500;
          }
          .prose code::before,
          .prose code::after {
            content: none;
          }

          /* 代码块 */
          .prose pre {
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
            padding: 0;
            border-radius: 0.5rem;
            overflow: hidden;
          }

          /* 引用 */
          .prose blockquote {
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
            padding: 1rem 1.5rem;
            border-left: 4px solid #14b8a6;
            background: #f0fdfa;
            border-radius: 0 0.5rem 0.5rem 0;
            font-style: italic;
            color: #4b5563;
          }
          .prose blockquote p {
            margin: 0;
          }

          /* 列表 */
          .prose ul,
          .prose ol {
            margin-top: 1rem;
            margin-bottom: 1rem;
            padding-left: 1.75rem;
          }
          .prose li {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            line-height: 1.75;
            color: #4b5563;
          }
          .prose ul > li {
            padding-left: 0.5rem;
          }
          .prose ol > li {
            padding-left: 0.5rem;
          }
          .prose ul > li::marker {
            color: #0d9488;
          }
          .prose ol > li::marker {
            color: #0d9488;
            font-weight: 600;
          }

          /* 任务列表 */
          .prose .task-list-item {
            list-style-type: none;
            margin-left: -1.75rem;
            padding-left: 0;
          }
          .prose .task-list-item input[type="checkbox"] {
            margin-right: 0.75rem;
            margin-top: 0.25rem;
            cursor: pointer;
          }

          /* 分隔线 */
          .prose hr {
            margin-top: 2.5rem;
            margin-bottom: 2.5rem;
            border: 0;
            border-top: 2px solid #e5e7eb;
          }

          /* 图片 */
          .prose img {
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          /* 表格 */
          .prose table {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          .prose thead {
            background: #f9fafb;
          }
          .prose tbody {
            background: #ffffff;
          }
          .prose tr {
            border-bottom: 1px solid #e5e7eb;
          }
          .prose tbody tr:last-child {
            border-bottom: none;
          }
          .prose tbody tr:hover {
            background: #f9fafb;
          }
          .prose th,
          .prose td {
            padding: 0.75rem 1rem;
            text-align: left;
            vertical-align: middle;
          }
          .prose th {
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            border-bottom: 2px solid #d1d5db;
          }
          .prose td {
            font-size: 0.9375rem;
            color: #374151;
          }
          .prose .table-wrapper {
            overflow-x: auto;
            margin: 2rem 0;
            border-radius: 0.5rem;
          }
        `}</style>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            table({ children }) {
              return (
                <div className="table-wrapper">
                  <table>{children}</table>
                </div>
              );
            },
            h1({ children }) {
              return <h1 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h1>;
            },
            h2({ children }) {
              return <h2 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h2>;
            },
            h3({ children }) {
              return <h3 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h3>;
            },
            a({ href, children }) {
              const isExternal = href?.startsWith('http');
              return (
                <a
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </a>
              );
            },
            img({ src, alt }) {
              return (
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
              );
            },
            li({ children, className }) {
              const isTaskList = className?.includes('task-list-item');
              if (isTaskList) {
                return <li className="task-list-item">{children}</li>;
              }
              return <li>{children}</li>;
            },
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match;
              return isInline ? (
                <code {...props}>{children}</code>
              ) : (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    padding: '1.5rem'
                  }}
                  showLineNumbers
                  wrapLines
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
