import { useState, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { fetchWithRetry, estimateTokens, truncateText, formatApiError } from '../utils/apiHelpers';

const MAX_CONTENT_TOKENS = 3000; // 为文件内容预留的最大 token 数

export function useAIOperations() {
  const {
    aiSettings,
    aiAdvancedSettings,
    aiMessagesMap,
    pendingAiContent,
    addAiMessage,
    setPendingContent,
    clearPendingContent,
    files,
    activeFileId,
    updateFile
  } = useAppContext();

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // 获取当前文件的 AI 消息
  const getCurrentMessages = useCallback(() => {
    return activeFileId ? (aiMessagesMap[activeFileId] || []) : [];
  }, [activeFileId, aiMessagesMap]);

  // 获取当前文件的待处理内容
  const getCurrentPendingContent = useCallback(() => {
    return activeFileId ? (pendingAiContent[activeFileId] || '') : '';
  }, [activeFileId, pendingAiContent]);

  // 提交 AI 请求
  const submitAIRequest = useCallback(async () => {
    if (!aiInput.trim() || !aiSettings.apiKey || !activeFileId) return;

    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile) return;

    const userMessage = aiInput.trim();
    setAiInput('');

    // 添加用户消息
    addAiMessage(activeFileId, { role: 'user', content: userMessage });
    setAiLoading(true);

    try {
      // 检查文件内容长度，如果太长则截断
      const contentTokens = estimateTokens(activeFile.content);
      let fileContent = activeFile.content;

      if (contentTokens > MAX_CONTENT_TOKENS) {
        fileContent = truncateText(activeFile.content, MAX_CONTENT_TOKENS);
        addAiMessage(activeFileId, {
          role: 'assistant',
          content: `⚠️ 文件内容过长（约 ${contentTokens} tokens），已自动截断到 ${MAX_CONTENT_TOKENS} tokens。`
        });
      }

      const apiUrl = aiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      // 使用带重试的 fetch
      const response = await fetchWithRetry(
        apiUrl,
        {
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
                content: aiAdvancedSettings.systemPrompt || '你是一个Markdown排版优化助手。'
              },
              {
                role: 'user',
                content: `请优化以下Markdown文件的排版：\n\n${fileContent}\n\n用户需求：${userMessage}`
              }
            ],
            temperature: aiAdvancedSettings.temperature || 0.3,
            max_tokens: 4000
          }),
          signal: controller.signal
        },
        2, // 最多重试 2 次
        1000 // 重试延迟 1 秒
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API请求失败 (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const optimizedContent = data.choices?.[0]?.message?.content || '';

      if (optimizedContent) {
        setPendingContent(activeFileId, optimizedContent);
        addAiMessage(activeFileId, {
          role: 'assistant',
          content: '✅ 已生成优化内容，请确认是否应用到文件。'
        });
      } else {
        addAiMessage(activeFileId, {
          role: 'assistant',
          content: '❌ 未返回有效内容，请重试。'
        });
      }
    } catch (error: unknown) {
      const errorMessage = formatApiError(error);
      addAiMessage(activeFileId, {
        role: 'assistant',
        content: `❌ 错误: ${errorMessage}`
      });
    } finally {
      setAiLoading(false);
    }
  }, [
    aiInput,
    aiSettings,
    aiAdvancedSettings,
    activeFileId,
    files,
    addAiMessage,
    setPendingContent
  ]);

  // 应用 AI 内容
  const applyAIContent = useCallback(() => {
    if (!activeFileId) return;
    const content = pendingAiContent[activeFileId];
    if (!content) return;

    updateFile(activeFileId, { content, isDirty: true });
    clearPendingContent(activeFileId);
    addAiMessage(activeFileId, {
      role: 'assistant',
      content: '已应用优化内容到文件。'
    });
  }, [activeFileId, pendingAiContent, updateFile, clearPendingContent, addAiMessage]);

  // 放弃 AI 内容
  const dismissAIContent = useCallback(() => {
    if (!activeFileId) return;
    clearPendingContent(activeFileId);
    addAiMessage(activeFileId, {
      role: 'assistant',
      content: '已放弃本次优化内容。'
    });
  }, [activeFileId, clearPendingContent, addAiMessage]);

  return {
    aiInput,
    aiLoading,
    setAiInput,
    getCurrentMessages,
    getCurrentPendingContent,
    submitAIRequest,
    applyAIContent,
    dismissAIContent
  };
}
