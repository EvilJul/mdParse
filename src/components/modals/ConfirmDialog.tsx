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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-xl p-6 w-96 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl dialog-animate`}>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>文件未保存</h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>文件尚未保存，是否保存后再关闭？</p>
        <div className="flex gap-2">
          <button
            onClick={onSaveAndClose}
            className="flex-1 py-2 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 hover:shadow-md"
          >
            保存并关闭
          </button>
          <button
            onClick={onDiscardAndClose}
            className={`flex-1 py-2 rounded-2xl ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
          >
            不保存
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 py-2 rounded-2xl ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
