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
      className={`flex flex-col transition-all duration-300 ease-out ${
        isDark ? 'bg-sidebar-dark text-gray-300 border-r border-border-dark' : 'bg-sidebar text-gray-600 border-r border-border'
      }`}
      style={{ width }}
    >
      <div className="flex items-center justify-between px-3 h-11 border-b border-inherit">
        <span className={`text-[11px] font-semibold tracking-widest uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>文件</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onNewFile}
            className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-sidebar-item-dark text-gray-500 hover:text-gray-300' : 'hover:bg-sidebar-item text-gray-400 hover:text-gray-600'}`}
            title="新建文件"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-sidebar-item-dark text-gray-500 hover:text-gray-300' : 'hover:bg-sidebar-item text-gray-400 hover:text-gray-600'}`}
            title="隐藏侧边栏"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-1 px-1.5">
        {folderPath && (
          <div className={`flex items-center gap-1.5 px-2 py-1.5 mb-0.5 rounded-sm text-[11px] ${isDark ? 'bg-sidebar-item-dark text-gray-400' : 'bg-sidebar-item text-gray-500'}`}>
            <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="truncate flex-1">{folderPath.split(/[\\/]/).pop()}</span>
            <button onClick={onCloseFolder} className={`p-0.5 rounded-sm ${isDark ? 'hover:bg-sidebar-item text-gray-500' : 'hover:bg-sidebar text-gray-400'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    if (e.key === 'Enter') e.currentTarget.blur();
                    else if (e.key === 'Escape') onRenameCancel();
                  }}
                  autoFocus
                  className={`w-full px-2 py-1 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isDark ? 'bg-sidebar-item-dark border border-border-dark text-gray-200' : 'bg-white border border-border-strong text-gray-900'}`}
                />
              ) : (
                <button
                  onClick={() => onFileClick(file)}
                  onContextMenu={(e) => onContextMenu(e, file)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-left rounded-sm transition-all duration-100 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-500 font-medium'
                      : (isDark ? 'text-gray-400 hover:bg-sidebar-item-dark' : 'text-gray-500 hover:bg-sidebar-item')
                  }`}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate flex-1 text-left">{file.name}</span>
                  {existingFile?.isDirty && <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />}
                </button>
              )}
            </div>
          );
        })}

        {files.filter(f => !folderFiles.some(gf => gf.name === f.name)).map(file => (
          <div key={file.id} className="relative group">
            <button
              onClick={() => onOpenedFileClick(file.id)}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-left rounded-sm transition-all duration-100 ${
                activeFileId === file.id
                  ? 'bg-emerald-500/10 text-emerald-500 font-medium'
                  : (isDark ? 'text-gray-400 hover:bg-sidebar-item-dark' : 'text-gray-500 hover:bg-sidebar-item')
              }`}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate flex-1 text-left">{file.name}</span>
              {file.isDirty && <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseFile(file.id); }}
              className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-sidebar-item-dark' : 'text-gray-400 hover:text-gray-600 hover:bg-sidebar-item'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {files.length === 0 && !folderPath && (
          <div className={`p-6 text-center text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            <svg className="w-6 h-6 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            暂无打开的文件
          </div>
        )}
      </div>
    </div>
  );
}
