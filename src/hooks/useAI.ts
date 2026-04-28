import { useState, useCallback, useEffect } from 'react';
import type { AISettings, FileState } from '../types';

export function useAI(activeFile: FileState | null, activeFileId: string | null) {
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('mdparse-ai-settings');
    return saved ? JSON.parse(saved) : {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      provider: 'openai'
    };
  });

  const [aiAdvancedSettings, setAiAdvancedSettings] = useState(() => {
    const saved = localStorage.getItem('mdparse-ai-advanced');
    return saved ? JSON.parse(saved) : {
      temperature: 0.3,
      systemPrompt: '你是一个专业的Markdown助手，具备以下能力：\n1. 内容总结：提取核心要点，生成简洁摘要\n2. 排版优化：改善格式、结构和可读性\n3. 内容扩展：补充细节、添加示例\n4. 语法修正：修复Markdown语法错误\n\n根据用户的具体需求（总结/优化/扩展/修正），提供相应的帮助。如果用户要求优化或修正，直接返回修改后的完整内容；如果用户要求总结或分析，则提供清晰的说明。'
    };
  });

  const [aiMessagesMap, setAiMessagesMap] = useState<Record<string, { role: 'user' | 'assistant', content: string }[]>>(() => {
    const saved = localStorage.getItem('mdparse-ai-messages');
    return saved ? JSON.parse(saved) : {};
  });

  const [pendingAiContent, setPendingAiContent] = useState<Record<string, string>>({});
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreviewZoom, setAiPreviewZoom] = useState(100);

  const aiMessages = activeFileId ? (aiMessagesMap[activeFileId] || []) : [];
  const pendingContent = activeFileId ? (pendingAiContent[activeFileId] || '') : '';

  useEffect(() => {
    localStorage.setItem('mdparse-ai-settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  useEffect(() => {
    localStorage.setItem('mdparse-ai-advanced', JSON.stringify(aiAdvancedSettings));
  }, [aiAdvancedSettings]);

  useEffect(() => {
    localStorage.setItem('mdparse-ai-messages', JSON.stringify(aiMessagesMap));
  }, [aiMessagesMap]);

  const handleAISubmit = useCallback(async () => {
    if (!aiInput.trim() || !aiSettings.apiKey || !activeFile || !activeFileId) return;

    const userMessage = aiInput.trim();
    setAiInput('');

    setAiMessagesMap(prev => ({
      ...prev,
      [activeFileId]: [...(prev[activeFileId] || []), { role: 'user', content: userMessage }]
    }));

    setAiLoading(true);

    try {
      const apiUrl = aiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.apiKey}`
        },
        body: JSON.stringify({
          model: aiSettings.model,
          messages: [
            {
              role: 'system',
              content: aiAdvancedSettings.systemPrompt || '你是一个专业的Markdown助手，具备以下能力：\n1. 内容总结：提取核心要点，生成简洁摘要\n2. 排版优化：改善格式、结构和可读性\n3. 内容扩展：补充细节、添加示例\n4. 语法修正：修复Markdown语法错误\n\n根据用户的具体需求（总结/优化/扩展/修正），提供相应的帮助。如果用户要求优化或修正，直接返回修改后的完整内容；如果用户要求总结或分析，则提供清晰的说明。'
            },
            {
              role: 'user',
              content: `当前Markdown文件内容：\n\n${activeFile.content}\n\n用户需求：${userMessage}`
            }
          ],
          temperature: aiAdvancedSettings.temperature || 0.3,
          max_tokens: 4000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API请求失败 (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const optimizedContent = data.choices?.[0]?.message?.content || '';

      if (optimizedContent) {
        setPendingAiContent(prev => ({
          ...prev,
          [activeFileId]: optimizedContent
        }));
        setAiMessagesMap(prev => ({
          ...prev,
          [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: '已生成优化内容，请确认是否应用到文件。' }]
        }));
      } else {
        setAiMessagesMap(prev => ({
          ...prev,
          [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: '未返回有效内容，请重试。' }]
        }));
      }
    } catch (error: unknown) {
      let errorMessage = '未知错误';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '请求超时（120秒），请检查网络或尝试更短的文本。';
        } else {
          errorMessage = error.message;
        }
      }

      setAiMessagesMap(prev => ({
        ...prev,
        [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: `错误: ${errorMessage}` }]
      }));
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiSettings, activeFile, activeFileId, aiAdvancedSettings]);

  const handleApplyAiContent = useCallback((onApply: (content: string) => void) => {
    if (!activeFileId || !pendingAiContent[activeFileId]) return;

    onApply(pendingAiContent[activeFileId]);

    setPendingAiContent(prev => {
      const newMap = { ...prev };
      delete newMap[activeFileId];
      return newMap;
    });

    setAiMessagesMap(prev => ({
      ...prev,
      [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: '已应用优化内容到文件。' }]
    }));
  }, [activeFileId, pendingAiContent]);

  const handleDismissAiContent = useCallback(() => {
    if (!activeFileId) return;

    setPendingAiContent(prev => {
      const newMap = { ...prev };
      delete newMap[activeFileId];
      return newMap;
    });

    setAiMessagesMap(prev => ({
      ...prev,
      [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: '已放弃本次优化内容。' }]
    }));
  }, [activeFileId]);

  return {
    aiSettings,
    setAiSettings,
    aiAdvancedSettings,
    setAiAdvancedSettings,
    aiMessages,
    pendingContent,
    aiInput,
    setAiInput,
    aiLoading,
    aiPreviewZoom,
    setAiPreviewZoom,
    handleAISubmit,
    handleApplyAiContent,
    handleDismissAiContent
  };
}
