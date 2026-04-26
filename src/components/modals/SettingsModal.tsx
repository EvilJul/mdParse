import { useState } from 'react';

interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: 'openai' | 'deepseek' | 'custom';
}

interface AIAdvancedSettings {
  temperature: number;
  systemPrompt: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  fontSize: number;
  aiSettings: AISettings;
  aiAdvancedSettings: AIAdvancedSettings;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onFontSizeChange: (size: number) => void;
  onAiSettingsChange: (settings: AISettings) => void;
  onAiAdvancedSettingsChange: (settings: AIAdvancedSettings) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  fontSize,
  aiSettings,
  aiAdvancedSettings,
  onThemeChange,
  onFontSizeChange,
  onAiSettingsChange,
  onAiAdvancedSettingsChange
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'about'>('general');
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!aiSettings.apiKey || !aiSettings.baseUrl || !aiSettings.model) {
      setAiTestResult({ success: false, message: '请填写 API Key、Base URL 和模型' });
      return;
    }
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const apiUrl = aiSettings.baseUrl.replace(/\/$/, '') + '/models';
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${aiSettings.apiKey}` }
      });
      if (response.ok) {
        setAiTestResult({ success: true, message: '连接成功！' });
      } else {
        setAiTestResult({ success: false, message: `连接失败: ${response.status}` });
      }
    } catch (error) {
      setAiTestResult({ success: false, message: `连接失败: ${(error as Error).message}` });
    } finally {
      setAiTesting(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('mdparse-ai-settings', JSON.stringify(aiSettings));
    localStorage.setItem('mdparse-ai-advanced', JSON.stringify(aiAdvancedSettings));
    setAiTestResult({ success: true, message: '保存成功！' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className={`w-[700px] max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden dialog-animate ${isDark ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>设置</h2>
          <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[450px]">
          {/* Left Sidebar */}
          <div className={`w-40 border-r p-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'general'
                    ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white')
                    : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                }`}
              >
                通用
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'ai'
                    ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white')
                    : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                }`}
              >
                AI 配置
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'about'
                    ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white')
                    : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                }`}
              >
                关于
              </button>
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex-1 p-6 overflow-auto">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>主题</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onThemeChange('light')}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                        theme === 'light'
                          ? 'border-emerald-500 bg-emerald-50'
                          : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300')
                      }`}
                    >
                      <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-white border flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>浅色</div>
                    </button>
                    <button
                      onClick={() => onThemeChange('dark')}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-emerald-500 bg-emerald-900/20'
                          : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300')
                      }`}
                    >
                      <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-800 border flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </div>
                      <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>深色</div>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>编辑器字体大小</label>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value);
                      onFontSizeChange(size);
                      localStorage.setItem('mdparse-font-size', size.toString());
                    }}
                    className="w-full"
                  />
                  <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>12px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>API Key</label>
                  <input
                    type="password"
                    value={aiSettings.apiKey}
                    onChange={(e) => onAiSettingsChange({ ...aiSettings, apiKey: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="输入 API Key"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>AI 提供商</label>
                  <select
                    value={aiSettings.provider}
                    onChange={(e) => {
                      const provider = e.target.value;
                      const baseUrls: Record<string, string> = {
                        openai: 'https://api.openai.com/v1',
                        deepseek: 'https://api.deepseek.com/v1',
                        custom: ''
                      };
                      onAiSettingsChange({
                        ...aiSettings,
                        provider: provider as 'openai' | 'deepseek' | 'custom',
                        baseUrl: baseUrls[provider] || ''
                      });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>

                {aiSettings.provider === 'custom' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>API 地址</label>
                    <input
                      type="text"
                      value={aiSettings.baseUrl}
                      onChange={(e) => onAiSettingsChange({ ...aiSettings, baseUrl: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>模型</label>
                  <input
                    type="text"
                    value={aiSettings.model}
                    onChange={(e) => onAiSettingsChange({ ...aiSettings, model: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="gpt-3.5-turbo"
                  />
                </div>

                {/* Test Connection */}
                <button
                  onClick={handleTestConnection}
                  disabled={aiTesting}
                  className={`w-full py-2 rounded-lg font-medium transition-all ${
                    aiTesting
                      ? (isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                      : (isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                  }`}
                >
                  {aiTesting ? '测试中...' : '测试连接'}
                </button>

                {aiTestResult && (
                  <div className={`text-sm px-3 py-2 rounded-lg ${aiTestResult.success ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700') : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700')}`}>
                    {aiTestResult.message}
                  </div>
                )}

                <hr className={`${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

                {/* System Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>System Prompt</label>
                    <button
                      onClick={() => onAiAdvancedSettingsChange({
                        ...aiAdvancedSettings,
                        systemPrompt: '你是一个Markdown排版优化助手。用户会给你一段Markdown内容，你需要优化其排版，使其更符合Markdown语法规范，结构更清晰。直接返回优化后的内容，不要添加任何解释。'
                      })}
                      className={`text-xs ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      恢复默认
                    </button>
                  </div>
                  <textarea
                    value={aiAdvancedSettings.systemPrompt}
                    onChange={(e) => onAiAdvancedSettingsChange({ ...aiAdvancedSettings, systemPrompt: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    rows={4}
                    placeholder="输入自定义 System Prompt..."
                  />
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    不填写时使用默认 Prompt
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
                  >
                    保存设置
                  </button>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">M</span>
                </div>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>mdParse</h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Markdown Reader & Editor</p>
                <p className={`text-sm mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>版本 0.1.0</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
