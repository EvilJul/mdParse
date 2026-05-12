import { useState } from 'react';

interface FileSearchBarProps {
  onSearch: (query: string) => void;
  isDark: boolean;
}

export function FileSearchBar({ onSearch, isDark }: FileSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <svg 
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="搜索文件..."
          className={`w-full pl-9 pr-8 py-2 text-sm rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:bg-gray-700 focus:border-emerald-500' 
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:shadow-sm'
          }`}
        />
        {query && (
          <button
            onClick={handleClear}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all duration-200 ${
              isDark ? 'hover:bg-gray-600 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
