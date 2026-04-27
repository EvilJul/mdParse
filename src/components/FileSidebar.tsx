interface FileSidebarProps {
  isOpen: boolean;
  isDark: boolean;
  width: number;
  folderPath: string | null;
  folderFiles: Array<{ name: string; path: string }>;
  files: Array<{ id: string; name: string; content: string; isDirty: boolean; filePath?: string }>;
  activeFileId: string | null;
  renamingFile: { path: string } | null;
  renameValue: string;
  onClose: () => void;
  onNewFile: () => void;
  onFileClick: (file: { name: string; path: string }) => void;
  onOpenedFileClick: (fileId: string) => void;
  onCloseFile: (fileId: string) => void;
  onContextMenu: (e: React.MouseEvent, file: { name: string; path: string }) => void;
  onRenameChange: (value: string) => void;
  onRenameComplete: (oldPath: string, newName: string) => void;
  onRenameCancel: () => void;
  onCloseFolder: () => void;
}

export function FileSidebar({
  isOpen,
  isDark,
  width,
  folderPath,
  folderFiles,
  files,
  activeFileId,
  renamingFile,
  renameValue,
  onClose,
  onNewFile,
  onFileClick,
  onOpenedFileClick,
  onCloseFile,
  onContextMenu,
  onRenameChange,
  onRenameComplete,
  onRenameCancel,
  onCloseFolder
}: FileSidebarProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`flex flex-col border-r transition-all duration-300 ease-out ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      style={{ width }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50">
        <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>文件</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewFile}
            className={`p-1.5 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            title="新建文件"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            title="隐藏侧边栏"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {folderPath && (
          <div className={`flex items-center gap-2 px-3 py-2.5 mb-1 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className={`text-sm font-medium truncate flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {folderPath.split(/[\\/]/).pop()}
            </span>
            <button
              onClick={onCloseFolder}
              className={`p-1 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-600/50 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200/50 text-gray-400 hover:text-gray-600'}`}
              title="关闭文件夹"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {folderFiles.map((file, idx) => {
          const existingFile = files.find(f => f.name === file.name);
          const isActive = existingFile?.id === activeFileId;
          const isRenaming = renamingFile?.path === file.path;
          return (
            <div key={`folder-${idx}`} className="relative group">
              {isRenaming ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => onRenameChange(e.target.value)}
                  onBlur={() => {
                    if (renameValue && renameValue !== file.name) {
                      onRenameComplete(file.path, renameValue);
                    } else {
                      onRenameCancel();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      onRenameCancel();
                    }
                  }}
                  autoFocus
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              ) : (
                <button
                  onClick={() => onFileClick(file)}
                  onContextMenu={(e) => onContextMenu(e, file)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl transition-all duration-200 ${
                    isActive
                      ? (isDark ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md')
                      : (isDark ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate flex-1">{file.name}</span>
                  {existingFile?.isDirty && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />}
                </button>
              )}
            </div>
          );
        })}

        {files.filter(f => !folderFiles.some(gf => gf.name === f.name)).map(file => (
          <div key={file.id} className="relative group">
            <button
              onClick={() => onOpenedFileClick(file.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl transition-all duration-200 ${
                activeFileId === file.id
                  ? (isDark ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md')
                  : (isDark ? 'text-gray-300 hover:bg-gray-700/50 hover:text-gray-100' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate flex-1">{file.name}</span>
              {file.isDirty && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile(file.id);
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${activeFileId === file.id ? 'hover:bg-white/20' : (isDark ? 'hover:bg-gray-600/50' : 'hover:bg-gray-200/50')}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {files.length === 0 && !folderPath && (
          <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            暂无打开的文件
          </div>
        )}
      </div>
    </div>
  );
}
