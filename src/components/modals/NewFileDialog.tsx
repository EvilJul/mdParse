interface NewFileDialogProps {
  isOpen: boolean;
  fileName: string;
  theme: 'light' | 'dark';
  onFileNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function NewFileDialog({
  isOpen,
  fileName,
  theme,
  onFileNameChange,
  onConfirm,
  onCancel
}: NewFileDialogProps) {
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`p-5 w-72 border animate-in-scale ${isDark ? 'bg-panel-dark border-border-dark shadow-xl' : 'bg-panel border-border shadow-xl'}`}>
        <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-text'}`}>新建文件</h3>
        <input
          type="text"
          value={fileName}
          onChange={e => onFileNameChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="输入文件名"
          autoFocus
          className={`w-full px-2.5 py-1.5 text-xs mb-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
            isDark ? 'bg-sidebar-item-dark border border-border-dark text-gray-200 placeholder-gray-500' : 'bg-white border border-border-strong text-text placeholder-text-muted'
          }`}
        />
        <div className="flex justify-end gap-1.5">
          <button onClick={onCancel} className={`px-2.5 py-1.5 text-[11px] rounded-sm ${isDark ? 'text-gray-400 hover:bg-sidebar-item-dark' : 'text-text-muted hover:bg-sidebar'}`}>取消</button>
          <button onClick={onConfirm} className="px-2.5 py-1.5 text-[11px] rounded-sm bg-emerald-500 hover:bg-emerald-600 text-white">创建</button>
        </div>
      </div>
    </div>
  );
}
