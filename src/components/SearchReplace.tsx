import { useState } from 'react';

interface SearchReplaceProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onSearch: (query: string, isNext: boolean) => void;
  onReplace: (query: string, replacement: string) => void;
  onReplaceAll: (query: string, replacement: string) => void;
}

export function SearchReplace({ isOpen, isDark, onClose, onSearch, onReplace, onReplaceAll }: SearchReplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');

  if (!isOpen) return null;

  return (
    <div className={`absolute top-0 right-0 z-10 p-4 rounded-lg shadow-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>搜索和替换</span>
        <button
          onClick={onClose}
          className={`p-1 rounded hover:bg-gray-500/20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch(searchQuery, !e.shiftKey);
              }
            }}
            placeholder="搜索..."
            className={`flex-1 px-3 py-1.5 text-sm rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            autoFocus
          />
          <button
            onClick={() => onSearch(searchQuery, false)}
            className={`px-3 py-1.5 text-sm rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="上一个 (Shift+Enter)"
          >
            ↑
          </button>
          <button
            onClick={() => onSearch(searchQuery, true)}
            className={`px-3 py-1.5 text-sm rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="下一个 (Enter)"
          >
            ↓
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="替换为..."
            className={`flex-1 px-3 py-1.5 text-sm rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
          <button
            onClick={() => onReplace(searchQuery, replaceText)}
            className={`px-3 py-1.5 text-sm rounded ${isDark ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}
          >
            替换
          </button>
          <button
            onClick={() => onReplaceAll(searchQuery, replaceText)}
            className={`px-3 py-1.5 text-sm rounded ${isDark ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}
          >
            全部
          </button>
        </div>
      </div>
    </div>
  );
}
