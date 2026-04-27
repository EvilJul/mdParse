interface FileContextMenuProps {
  isOpen: boolean;
  isDark: boolean;
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function FileContextMenu({ isOpen, isDark, x, y, onRename, onDelete, onClose }: FileContextMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed z-50 py-1 rounded-lg shadow-xl border min-w-[140px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{
          left: `${Math.min(x, window.innerWidth - 160)}px`,
          top: `${Math.min(y, window.innerHeight - 100)}px`
        }}
      >
        <button
          onClick={onRename}
          className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
        >
          重命名
        </button>
        <button
          onClick={onDelete}
          className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500`}
        >
          删除
        </button>
      </div>
      <div className="fixed inset-0 z-40" onClick={onClose} />
    </>
  );
}
