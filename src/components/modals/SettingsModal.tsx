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
  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'ai' | 'about'>('general');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden dialog-animate ${isDark ? 'bg-gray-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>设置</h2>
          <button onClick={onClose} className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-2 px-8 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          {[
            { id: 'general', label: '通用', icon: '🎨' },
            { id: 'ai', label: 'AI 配置', icon: '🤖' },
            { id: 'about', label: '关于', icon: 'ℹ️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? (isDark ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md')
                  : (isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`overflow-auto p-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Theme Card */}
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>外观主题</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择你喜欢的界面风格</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => onThemeChange('light')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === 'light'
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                        : (isDark ? 'border-gray-600 hover:border-gray-500 bg-gray-800' : 'border-gray-200 hover:border-gray-300 bg-white')
                    }`}
                  >
                    <div className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>☀️ 浅色模式</div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>明亮清爽</div>
                  </button>
                  <button
                    onClick={() => onThemeChange('dark')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === 'dark'
                        ? (isDark ? 'border-emerald-500 bg-emerald-900 shadow-lg' : 'border-emerald-500 bg-emerald-50 shadow-lg')
                        : (isDark ? 'border-gray-600 hover:border-gray-500 bg-gray-800' : 'border-gray-200 hover:border-gray-300 bg-white')
                    }`}
                  >
                    <div className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>🌙 深色模式</div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>护眼舒适</div>
                  </button>
                </div>
              </div>

              {/* Font Size Card */}
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>编辑器字体大小</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>调整编辑器文字大小</p>
                  </div>
                  <span className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fontSize}px</span>
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className={`flex justify-between text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <span>小 (12px)</span>
                  <span>中 (18px)</span>
                  <span>大 (24px)</span>
                </div>
                {/* Preview */}
                <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <p className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: `${fontSize}px` }}>
                    预览文本：The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Basic Config Card */}
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="mb-5">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>基础配置</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>配置 AI 服务连接信息</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>API Key</label>
                    <input
                      type="password"
                      value={aiSettings.apiKey}
                      onChange={(e) => onAiSettingsChange({ ...aiSettings, apiKey: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
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
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
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
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
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
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      placeholder="gpt-3.5-turbo"
                    />
                  </div>

                  {/* Test Connection */}
                  <button
                    onClick={handleTestConnection}
                    disabled={aiTesting}
                    className={`w-full py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                      aiTesting
                        ? (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : (isDark ? 'bg-gray-700 text-white hover:bg-gray-600 shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm')
                    }`}
                  >
                    {aiTesting ? '测试中...' : '测试连接'}
                  </button>

                  {aiTestResult && (
                    <div className={`text-sm px-4 py-3 rounded-xl font-medium ${aiTestResult.success ? (isDark ? 'bg-green-900 text-green-100' : 'bg-green-50 text-green-700') : (isDark ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-700')}`}>
                      {aiTestResult.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Config Card */}
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="mb-5">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>高级设置</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>自定义 AI 行为</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>System Prompt</label>
                      <button
                        onClick={() => onAiAdvancedSettingsChange({
                          ...aiAdvancedSettings,
                          systemPrompt: '你是一个Markdown排版优化助手。用户会给你一段Markdown内容，你需要优化其排版，使其更符合Markdown语法规范，结构更清晰。直接返回优化后的内容，不要添加任何解释。'
                        })}
                        className={`text-xs px-3 py-1 rounded-lg transition-all duration-200 ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                      >
                        恢复默认
                      </button>
                    </div>
                    <textarea
                      value={aiAdvancedSettings.systemPrompt}
                      onChange={(e) => onAiAdvancedSettingsChange({ ...aiAdvancedSettings, systemPrompt: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      rows={5}
                      placeholder="输入自定义 System Prompt..."
                    />
                    <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      不填写时使用默认 Prompt
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  保存设置
                </button>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="text-center py-12 max-w-md mx-auto">
              <div className="mb-8">
                <h3 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>mdParse</h3>
                <p className={`text-base mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Markdown Reader & Editor</p>
                <p className={`text-sm mb-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>版本 0.1.0</p>
              </div>
              
              <div className={`grid grid-cols-2 gap-4 mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✨</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>实时编辑</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>👁️</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>即时预览</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>🤖</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>AI 助手</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>📁</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>文件管理</div>
                </div>
              </div>

              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                © 2024 mdParse. All rights reserved.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
