import { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  fontSize: number;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onFontSizeChange: (size: number) => void;
}

type SettingsTab = 'general' | 'about';

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: '通用' },
  { id: 'about', label: '关于' }
];

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  fontSize,
  onThemeChange,
  onFontSizeChange
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden border animate-in-scale ${
          isDark ? 'bg-panel-dark border-border-dark shadow-xl' : 'bg-panel border-border shadow-xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-4 h-11 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
          <h2 className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-text'}`}>设置</h2>
          <button onClick={onClose} className={`p-1 rounded-sm ${isDark ? 'hover:bg-sidebar-item-dark text-gray-500' : 'hover:bg-sidebar text-text-muted'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`flex gap-1 px-4 py-2.5 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-[11px] rounded-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white'
                  : (isDark ? 'text-gray-400 hover:bg-sidebar-item-dark' : 'text-text-muted hover:bg-sidebar')
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-auto p-5" style={{ maxHeight: 'calc(85vh - 95px)' }}>
          {activeTab === 'general' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <section className={`p-4 ${isDark ? 'bg-sidebar-item-dark' : 'bg-sidebar'}`}>
                <div className="mb-3">
                  <h3 className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-text'}`}>外观主题</h3>
                  <p className={`mt-0.5 text-[11px] ${isDark ? 'text-gray-500' : 'text-text-muted'}`}>选择界面颜色方案。</p>
                </div>
                <div className={`inline-flex rounded-sm border ${isDark ? 'border-border-dark' : 'border-border'}`}>
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] transition-colors ${
                      theme === 'light'
                        ? 'bg-emerald-500 text-white'
                        : (isDark ? 'text-gray-400 hover:bg-sidebar-item' : 'text-text-muted hover:bg-sidebar-item')
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    浅色
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] transition-colors ${
                      theme === 'dark'
                        ? 'bg-emerald-500 text-white'
                        : (isDark ? 'text-gray-400 hover:bg-sidebar-item' : 'text-text-muted hover:bg-sidebar-item')
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    深色
                  </button>
                </div>
              </section>

              <section className={`p-4 ${isDark ? 'bg-sidebar-item-dark' : 'bg-sidebar'}`}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-text'}`}>编辑器字体</h3>
                    <p className={`mt-0.5 text-[11px] ${isDark ? 'text-gray-500' : 'text-text-muted'}`}>调整编辑区文字大小。</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-500">{fontSize}px</span>
                </div>
                <input type="range" min="12" max="24" value={fontSize} onChange={e => onFontSizeChange(parseInt(e.target.value))} className="w-full accent-emerald-500" />
                <div className={`mt-1 flex justify-between text-[10px] ${isDark ? 'text-gray-500' : 'text-text-muted'}`}>
                  <span>12px</span>
                  <span>18px</span>
                  <span>24px</span>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="text-center py-10">
              <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-text'}`}>mdParse</h3>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-text-muted'}`}>Markdown Reader & Editor</p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-text-muted'}`}>版本 0.2.0</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
