import { useState } from 'react';

interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: 'openai' | 'deepseek' | 'custom';
}

interface AIAdvancedSettings {
  temperature?: number;
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

type SettingsTab = 'general' | 'ai' | 'about';

const DEFAULT_SYSTEM_PROMPT =
  '你是一个 Markdown 排版优化助手。用户会给你一段 Markdown 内容，你需要优化其排版，使其更符合 Markdown 语法规范，结构更清晰。直接返回优化后的内容，不要添加任何解释。';

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: '通用' },
  { id: 'ai', label: 'AI 配置' },
  { id: 'about', label: '关于' }
];

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!aiSettings.apiKey || !aiSettings.baseUrl || !aiSettings.model) {
      setAiTestResult({ success: false, message: '请填写 API Key、API 地址和模型。' });
      return;
    }

    setAiTesting(true);
    setAiTestResult(null);

    try {
      const apiUrl = `${aiSettings.baseUrl.replace(/\/$/, '')}/models`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${aiSettings.apiKey}` }
      });

      setAiTestResult(
        response.ok
          ? { success: true, message: '连接成功。' }
          : { success: false, message: `连接失败：${response.status}` }
      );
    } catch (error) {
      setAiTestResult({ success: false, message: `连接失败：${(error as Error).message}` });
    } finally {
      setAiTesting(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('mdparse-ai-settings', JSON.stringify(aiSettings));
    localStorage.setItem('mdparse-ai-advanced', JSON.stringify(aiAdvancedSettings));
    setAiTestResult({ success: true, message: '设置已保存。' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">设置</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="关闭设置"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 px-6 py-3 dark:border-gray-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-auto p-6" style={{ maxHeight: 'calc(90vh - 145px)' }}>
          {/* ── General Tab ── */}
          {activeTab === 'general' && (
            <div className="mx-auto max-w-2xl space-y-5">
              {/* Theme Selection */}
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">外观主题</h3>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">选择界面颜色方案。</p>
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    className={`flex items-center gap-2 rounded-l-lg px-4 py-2 text-sm font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    浅色
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    className={`flex items-center gap-2 rounded-r-lg px-4 py-2 text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    深色
                  </button>
                </div>
              </section>

              {/* Font Size */}
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">编辑器字体大小</h3>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">调整编辑区文字大小。</p>
                  </div>
                  <span className="text-xl font-semibold text-emerald-500">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={e => onFontSizeChange(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="mt-2 flex justify-between text-xs text-gray-700 dark:text-gray-400">
                  <span>12px</span>
                  <span>18px</span>
                  <span>24px</span>
                </div>
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="font-mono text-gray-900 dark:text-gray-100" style={{ fontSize: `${fontSize}px` }}>
                    # Markdown Preview
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* ── AI Tab ── */}
          {activeTab === 'ai' && (
            <div className="mx-auto max-w-2xl space-y-5">
              {/* Basic Config */}
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">基础配置</h3>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">配置 AI 服务连接信息。</p>
                </div>
                <div className="space-y-4">
                  {/* API Key */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-300">API Key</label>
                    <input
                      type="password"
                      value={aiSettings.apiKey}
                      onChange={e => onAiSettingsChange({ ...aiSettings, apiKey: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                      placeholder="输入 API Key"
                    />
                  </div>

                  {/* Provider */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-300">AI 提供商</label>
                    <select
                      value={aiSettings.provider}
                      onChange={e => {
                        const provider = e.target.value as AISettings['provider'];
                        const baseUrls: Record<AISettings['provider'], string> = {
                          openai: 'https://api.openai.com/v1',
                          deepseek: 'https://api.deepseek.com/v1',
                          custom: ''
                        };
                        onAiSettingsChange({ ...aiSettings, provider, baseUrl: baseUrls[provider] });
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>

                  {/* Custom API URL */}
                  {aiSettings.provider === 'custom' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-300">API 地址</label>
                      <input
                        type="text"
                        value={aiSettings.baseUrl}
                        onChange={e => onAiSettingsChange({ ...aiSettings, baseUrl: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                        placeholder="https://api.example.com/v1"
                      />
                    </div>
                  )}

                  {/* Model */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-300">模型</label>
                    <input
                      type="text"
                      value={aiSettings.model}
                      onChange={e => onAiSettingsChange({ ...aiSettings, model: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                      placeholder="gpt-3.5-turbo"
                    />
                  </div>

                  {/* Test Connection Button */}
                  <button
                    onClick={handleTestConnection}
                    disabled={aiTesting}
                    className={`w-full rounded-lg px-4 py-2 font-medium transition-colors ${
                      aiTesting
                        ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {aiTesting ? '测试中...' : '测试连接'}
                  </button>

                  {/* Test Result */}
                  {aiTestResult && (
                    <div
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        aiTestResult.success
                          ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200'
                          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200'
                      }`}
                    >
                      {aiTestResult.message}
                    </div>
                  )}
                </div>
              </section>

              {/* Advanced Config */}
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">高级设置</h3>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">自定义 AI 行为。</p>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-800 dark:text-gray-300">System Prompt</label>
                  <button
                    onClick={() => onAiAdvancedSettingsChange({ ...aiAdvancedSettings, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
                    className="rounded-md px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    恢复默认
                  </button>
                </div>
                <textarea
                  value={aiAdvancedSettings.systemPrompt}
                  onChange={e => onAiAdvancedSettingsChange({ ...aiAdvancedSettings, systemPrompt: e.target.value })}
                  rows={6}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                  placeholder="输入自定义 System Prompt..."
                />
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white transition-colors hover:bg-emerald-500"
                  >
                    保存设置
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* ── About Tab ── */}
          {activeTab === 'about' && (
            <div className="mx-auto max-w-md py-10 text-center">
              <h3 className="mb-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">mdParse</h3>
              <p className="text-gray-700 dark:text-gray-400">Markdown Reader & Editor</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">版本 0.2.0</p>
              <div className="mt-8 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
                {['实时编辑', '即时预览', 'AI 助手', '文件管理'].map(item => (
                  <div
                    key={item}
                    className="rounded-lg bg-white p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
