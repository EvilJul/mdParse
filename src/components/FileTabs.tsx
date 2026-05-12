import type { FileState } from '../types';

interface FileTabsProps {
  files: FileState[];
  activeFileId: string | null;
  isDark: boolean;
  onTabClick: (fileId: string) => void;
  onTabClose: (fileId: string) => void;
}

export function FileTabs({ files, activeFileId, isDark, onTabClick, onTabClose }: FileTabsProps) {
  if (files.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-b overflow-x-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {files.map(file => (
        <div
          key={file.id}
          className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 ${
            activeFileId === file.id
              ? (isDark ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md')
              : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-sm')
          }`}
          onClick={() => onTabClick(file.id)}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium truncate max-w-[150px]">{file.name}</span>
          {file.isDirty && (
            <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 animate-pulse" title="未保存" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file.id);
            }}
            className="p-1 rounded-lg hover:bg-emerald-700 transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
