import type { ReactNode } from 'react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  children: ReactNode;
}

export function GuideModal({ isOpen, onClose, isDark, children }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`w-[800px] max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden dialog-animate ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Markdown 语法指南</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={`h-[60vh] overflow-auto p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
