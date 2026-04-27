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
    <div className={`w-80 border-l flex flex-col transition-all duration-300 ease-out ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-end p-4 border-b border-gray-200/50">
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-all duration-200 ${isDark ? 'hover:bg-gray-700/50 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm">发送消息开始对话</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : (isDark ? 'bg-gray-700/80 text-gray-100' : 'bg-gray-100 text-gray-800')
            }`}>
              <div className={`font-medium text-xs mb-1 ${msg.role === 'user' ? 'text-white/70' : (isDark ? 'text-emerald-400' : 'text-emerald-600')}`}>
                {msg.role === 'user' ? '你' : 'AI'}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-gray-700/80' : 'bg-gray-100'}`}>
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
              className={`p-4 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} whitespace-pre-wrap max-h-60 overflow-auto`}
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

      <div className="p-4 border-t border-gray-200/50">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="输入消息..."
            className={`flex-1 px-4 py-3 text-sm rounded-2xl border resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 ${
              isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            rows={3}
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !input.trim() || !hasApiKey || !hasActiveFile}
          className={`w-full mt-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
            loading || !input.trim() || !hasApiKey || !hasActiveFile
              ? (isDark ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-100 text-gray-400')
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg active:scale-[0.98]'
          }`}
        >
          {loading ? '处理中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
