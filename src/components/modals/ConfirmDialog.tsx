interface ConfirmDialogProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  onSaveAndClose: () => void;
  onDiscardAndClose: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  theme,
  onSaveAndClose,
  onDiscardAndClose,
  onCancel
}: ConfirmDialogProps) {
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`p-5 w-72 border animate-in-scale ${isDark ? 'bg-panel-dark border-border-dark shadow-xl' : 'bg-panel border-border shadow-xl'}`}>
        <h3 className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-text'}`}>文件未保存</h3>
        <p className={`text-[11px] mb-3 ${isDark ? 'text-gray-500' : 'text-text-muted'}`}>文件尚未保存，是否保存后再关闭？</p>
        <div className="flex gap-1.5">
          <button onClick={onSaveAndClose} className="flex-1 py-1.5 text-[11px] rounded-sm bg-emerald-500 text-white hover:bg-emerald-600">保存并关闭</button>
          <button onClick={onDiscardAndClose} className={`flex-1 py-1.5 text-[11px] rounded-sm ${isDark ? 'bg-sidebar-item-dark text-gray-400 hover:bg-sidebar-item' : 'bg-sidebar text-text-muted hover:bg-sidebar-item'}`}>不保存</button>
          <button onClick={onCancel} className={`flex-1 py-1.5 text-[11px] rounded-sm ${isDark ? 'bg-sidebar-item-dark text-gray-400 hover:bg-sidebar-item' : 'bg-sidebar text-text-muted hover:bg-sidebar-item'}`}>取消</button>
        </div>
      </div>
    </div>
  );
}
