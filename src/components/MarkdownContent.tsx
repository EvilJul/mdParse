import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ThemeType } from '../types';

interface MarkdownContentProps {
  content: string;
  theme: ThemeType;
}

export function MarkdownContent({ content, theme }: MarkdownContentProps) {
  const isDark = theme === 'dark';

  function CodeBlock({ language, code }: { language: string; code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className={`relative group my-5 rounded-lg overflow-hidden border ${isDark ? 'border-gray-700/40' : 'border-gray-200/60'}`}>
        <div className={`flex items-center justify-between px-3 py-1.5 ${isDark ? 'bg-gray-800/40 border-b border-gray-700/30' : 'bg-gray-100/60 border-b border-gray-200/50'}`}>
          <span className={`text-[11px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'} uppercase`}>{language || 'text'}</span>
          <button
            onClick={handleCopy}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all duration-150 ${
              copied
                ? 'bg-emerald-500 text-white'
                : (isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60')
            }`}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre className={`m-0 px-4 py-3 overflow-x-auto ${isDark ? 'bg-gray-900/30' : 'bg-gray-50/50'}`}>
          <code className="text-sm leading-relaxed" style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={`prose prose-lg max-w-none ${isDark ? 'prose-invert' : ''}`}>
      <style>{`
        .prose {
          color: ${isDark ? '#e5e7eb' : '#374151'};
          line-height: 1.75;
        }
        .prose h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 2rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid ${isDark ? '#374151' : '#e5e7eb'};
          color: ${isDark ? '#f9fafb' : '#111827'};
        }
        .prose h2 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          color: ${isDark ? '#f3f4f6' : '#1f2937'};
        }
        .prose h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: ${isDark ? '#e5e7eb' : '#374151'};
        }
        .prose h4 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.5;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: ${isDark ? '#d1d5db' : '#4b5563'};
        }
        .prose p {
          margin-top: 0;
          margin-bottom: 1.25rem;
          line-height: 1.75;
          color: ${isDark ? '#d1d5db' : '#4b5563'};
        }
        .prose a {
          color: ${isDark ? '#5eead4' : '#0d9488'};
          text-decoration: none;
          font-weight: 500;
        }
        .prose a:hover {
          color: ${isDark ? '#2dd4bf' : '#0f766e'};
          text-decoration: underline;
        }
        .prose strong {
          font-weight: 700;
          color: ${isDark ? '#f9fafb' : '#111827'};
        }
        .prose em {
          font-style: italic;
          color: ${isDark ? '#e5e7eb' : '#374151'};
        }
        .prose code {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875em;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          background: ${isDark ? '#1f2937' : '#f3f4f6'};
          color: ${isDark ? '#5eead4' : '#0d9488'};
          font-weight: 500;
        }
        .prose code::before,
        .prose code::after {
          content: none;
        }
        .prose pre {
          margin: 0;
          padding: 0;
          background: none;
        }
        .prose blockquote {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          padding: 1rem 1.5rem;
          border-left: 4px solid #14b8a6;
          background: ${isDark ? '#1f2937' : '#f0fdfa'};
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
          color: ${isDark ? '#d1d5db' : '#4b5563'};
        }
        .prose blockquote p {
          margin: 0;
        }
        .prose ul, .prose ol {
          margin-top: 1rem;
          margin-bottom: 1rem;
          padding-left: 1.75rem;
        }
        .prose li {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.75;
          color: ${isDark ? '#d1d5db' : '#4b5563'};
        }
        .prose ul > li::marker {
          color: #14b8a6;
        }
        .prose ol > li::marker {
          color: #14b8a6;
          font-weight: 600;
        }
        .prose hr {
          margin-top: 2.5rem;
          margin-bottom: 2.5rem;
          border: 0;
          border-top: 2px solid ${isDark ? '#374151' : '#e5e7eb'};
        }
        .prose img {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          max-width: 100%;
        }
        .prose table {
          display: table;
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 2rem;
          margin-bottom: 2rem;
          border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
        }
        .prose thead {
          background: ${isDark ? '#1f2937' : '#f9fafb'};
        }
        .prose tbody {
          background: ${isDark ? '#111827' : '#ffffff'};
        }
        .prose tr {
          border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        }
        .prose tbody tr:last-child {
          border-bottom: none;
        }
        .prose th, .prose td {
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .prose th {
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
          border-bottom: 2px solid ${isDark ? '#374151' : '#d1d5db'};
        }
        .prose td {
          font-size: 0.9375rem;
          color: ${isDark ? '#d1d5db' : '#374151'};
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return <code {...props}>{children}</code>;
            }

            const codeString = String(children).replace(/\n$/, '');
            const language = match[1];

            return <CodeBlock language={language} code={codeString} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
