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
    <div className={`flex items-center gap-1 px-2 py-1 border-b overflow-x-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {files.map(file => (
        <div
          key={file.id}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all ${
            activeFileId === file.id
              ? (isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900')
              : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
          }`}
          onClick={() => onTabClick(file.id)}
        >
          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
          {file.isDirty && (
            <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" title="未保存" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file.id);
            }}
            className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-500/20 transition-opacity ${
              activeFileId === file.id ? 'opacity-100' : ''
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
