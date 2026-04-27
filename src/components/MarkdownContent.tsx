import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ThemeType } from '../types';

interface MarkdownContentProps {
  content: string;
  theme: ThemeType;
}

export function MarkdownContent({ content, theme }: MarkdownContentProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const syntaxStyle = theme === 'dark' ? oneDark : oneLight;

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const isDark = theme === 'dark';

  const proseStyles = isDark
    ? `prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-a:text-teal-300 prose-code:text-emerald-300 prose-code:bg-gray-700 prose-pre:bg-gray-900 prose-blockquote:border-teal-400 prose-blockquote:bg-gray-800 prose-blockquote:text-white prose-th:bg-gray-700 prose-th:text-white prose-th:border-gray-600 prose-td:text-white prose-td:border-gray-600 prose-li:marker:text-teal-300 prose-hr:border-gray-500`
    : `prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-900 prose-em:text-gray-700 prose-a:text-teal-600 prose-code:text-teal-600 prose-code:bg-teal-50 prose-pre:bg-gray-900 prose-blockquote:border-teal-400 prose-blockquote:bg-teal-50 prose-blockquote:text-gray-700 prose-th:bg-gray-50 prose-th:text-gray-900 prose-th:border-gray-200 prose-td:text-gray-600 prose-td:border-gray-200 prose-li:marker:text-teal-400 prose-hr:border-gray-200`;

  return (
    <div className={`prose prose-lg max-w-none ${proseStyles}`}>
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return <code className={className} {...props}>{children}</code>;
            }

            const codeString = String(children).replace(/\n$/, '');
            const language = match[1] || 'text';
            const codeId = `code-${language}-${codeString.slice(0, 20)}`;

            return (
              <div className="relative group">
                <button
                  onClick={() => handleCopy(codeString, codeId)}
                  className={`absolute top-3 right-3 px-2 py-1 text-xs rounded transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 ${
                    isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {copied === codeId ? '已复制' : '复制'}
                </button>
                <SyntaxHighlighter
                  style={syntaxStyle}
                  language={language}
                  PreTag="div"
                  customStyle={{ margin: '1.5em 0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                  showLineNumbers
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
