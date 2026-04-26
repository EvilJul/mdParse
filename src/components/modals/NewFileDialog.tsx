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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-xl p-6 w-96 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl dialog-animate`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>新建文件</h3>
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
          className={`w-full px-4 py-2 border rounded-2xl mb-4 ${
            isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'
          }`}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-2xl ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-teal-500 text-white rounded-2xl hover:bg-teal-600"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
