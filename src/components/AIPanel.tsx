interface AIPanelProps {
  isOpen: boolean;
  isDark: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  input: string;
  loading: boolean;
  pendingContent: string | null;
  previewZoom: number;
  hasActiveFile: boolean;
  hasApiKey: boolean;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onApplyContent: () => void;
  onDismissContent: () => void;
  onShowPreview: () => void;
}

import { AutoResizeTextarea } from './AutoResizeTextarea';

export function AIPanel({
  isOpen,
  isDark,
  messages,
  input,
  loading,
  pendingContent,
  previewZoom,
  hasActiveFile,
  hasApiKey,
  onClose,
  onInputChange,
  onSubmit,
  onApplyContent,
  onDismissContent,
  onShowPreview
}: AIPanelProps) {
  if (!isOpen) return null;

  return (
    <div className={`w-96 border-l flex flex-col transition-all duration-300 ease-out shadow-2xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI 助手</h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>智能优化排版</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className={`flex-1 overflow-auto p-6 space-y-4 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        {messages.length === 0 && (
          <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-300">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className={`text-base font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              开始对话
            </h4>
            <p className="text-sm mb-6">
              发送消息让 AI 帮你优化文档
            </p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                由 AI 驱动
              </span>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : (isDark ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-gray-100 text-gray-800')
            }`}>
              <div className={`font-medium text-xs mb-1 ${msg.role === 'user' ? 'text-white' : (isDark ? 'text-emerald-400' : 'text-emerald-600')}`}>
                {msg.role === 'user' ? '你' : 'AI'}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {pendingContent && (
          <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-emerald-500">待应用优化内容：</div>
              <button
                onClick={onShowPreview}
                className={`px-3 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                全屏预览
              </button>
            </div>
            <div
              className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800 text-gray-200' : 'bg-gray-100 border-transparent'} whitespace-pre-wrap max-h-60 overflow-auto`}
              style={{ fontSize: `${previewZoom}%` }}
            >
              {pendingContent}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={onApplyContent}
                className="flex-1 py-1.5 bg-emerald-500 text-white text-sm rounded-2xl hover:bg-emerald-600 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
              >
                应用到文件
              </button>
              <button
                onClick={onDismissContent}
                className={`flex-1 py-1.5 text-sm rounded-2xl ${isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                放弃
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="flex gap-3">
          <AutoResizeTextarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="输入消息..."
            minRows={3}
            maxRows={8}
            className={`flex-1 px-4 py-3 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !input.trim() || !hasApiKey || !hasActiveFile}
          className={`w-full mt-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
            loading || !input.trim() || !hasApiKey || !hasActiveFile
              ? (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg active:scale-[0.98]'
          }`}
        >
          {loading ? '处理中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
