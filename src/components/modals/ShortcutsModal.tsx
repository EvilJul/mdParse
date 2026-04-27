interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  shortcuts: Array<{ keys: string; action: string }>;
}

export function ShortcutsModal({ isOpen, onClose, isDark, shortcuts }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className={`rounded-xl p-6 w-80 max-h-[80vh] overflow-auto ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>快捷键</h3>
          <button onClick={onClose} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} hover:text-gray-700`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            shortcut.keys ? (
              <div key={i} className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{shortcut.action}</span>
                <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{shortcut.keys}</kbd>
              </div>
            ) : (
              <div key={i} className="border-t my-2" />
            )
          ))}
        </div>
      </div>
    </div>
  );
}
