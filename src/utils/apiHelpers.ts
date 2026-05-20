/**
 * 带重试的 fetch 请求
 * @param url 请求 URL
 * @param options fetch 选项
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟（毫秒）
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      // 如果是 5xx 错误，可以重试
      if (response.status >= 500 && i < maxRetries) {
        lastError = new Error(`Server error: ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        continue;
      }

      // 如果是 429 (Too Many Requests)，等待后重试
      if (response.status === 429 && i < maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay * (i + 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // 网络错误可以重试
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * 检查文本长度是否超过 token 限制
 * 粗略估算：1 token ≈ 4 个字符（英文）或 1.5 个字符（中文）
 */
export function estimateTokens(text: string): number {
  // 简单估算：中文字符按 1.5 个字符/token，英文按 4 个字符/token
  const chineseChars = (text.match(/[一-龥]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

/**
 * 截断文本以适应 token 限制
 */
export function truncateText(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);

  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // 计算需要保留的字符比例
  const ratio = maxTokens / estimatedTokens;
  const targetLength = Math.floor(text.length * ratio * 0.9); // 留 10% 余量

  // 尝试在合适的位置截断（段落、句子）
  const truncated = text.substring(0, targetLength);
  const lastParagraph = truncated.lastIndexOf('\n\n');
  const lastSentence = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastParagraph > targetLength * 0.8) {
    return truncated.substring(0, lastParagraph) + '\n\n[内容过长，已截断...]';
  } else if (lastSentence > targetLength * 0.8) {
    return truncated.substring(0, lastSentence + 1) + '\n\n[内容过长，已截断...]';
  } else {
    return truncated + '\n\n[内容过长，已截断...]';
  }
}

/**
 * 格式化 API 错误消息
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return '请求超时，请检查网络连接或尝试更短的文本';
    }

    // 解析常见的 API 错误
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'API Key 无效或已过期，请检查设置';
    }

    if (message.includes('forbidden') || message.includes('403')) {
      return '没有权限访问此 API，请检查 API Key';
    }

    if (message.includes('not found') || message.includes('404')) {
      return 'API 端点不存在，请检查 Base URL 设置';
    }

    if (message.includes('too many requests') || message.includes('429')) {
      return 'API 请求过于频繁，请稍后再试';
    }

    if (message.includes('quota') || message.includes('limit')) {
      return 'API 配额已用完，请检查账户余额';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return '网络连接失败，请检查网络设置';
    }

    return error.message;
  }

  return '未知错误，请重试';
}
