/**
 * 简单的 API Key 加密/解密工具
 * 注意：这只是基础的混淆，不是真正的加密。
 * 在生产环境中，应该使用更安全的方案（如 Electron 的 safeStorage API）
 */

const ENCRYPTION_KEY = 'mdparse-secret-key-v1';

/**
 * 简单的 XOR 加密
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 编码
}

/**
 * 简单的 XOR 解密
 */
function xorDecrypt(encrypted: string, key: string): string {
  try {
    const decoded = atob(encrypted); // Base64 解码
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * 加密 API Key
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return '';
  return xorEncrypt(apiKey, ENCRYPTION_KEY);
}

/**
 * 解密 API Key
 */
export function decryptApiKey(encrypted: string): string {
  if (!encrypted) return '';
  return xorDecrypt(encrypted, ENCRYPTION_KEY);
}

/**
 * 安全地保存 API Key 到 localStorage
 */
export function saveApiKey(key: string, apiKey: string): void {
  try {
    const encrypted = encryptApiKey(apiKey);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Failed to save API key:', error);
  }
}

/**
 * 安全地从 localStorage 读取 API Key
 */
export function loadApiKey(key: string): string {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return '';
    return decryptApiKey(encrypted);
  } catch (error) {
    console.error('Failed to load API key:', error);
    return '';
  }
}

/**
 * 检查字符串是否是加密的 API Key
 */
export function isEncrypted(value: string): boolean {
  // 简单检查：加密后的值应该是 Base64 格式
  try {
    return value.length > 0 && btoa(atob(value)) === value;
  } catch {
    return false;
  }
}

/**
 * 迁移旧的未加密 API Key
 */
export function migrateApiKey(key: string): void {
  try {
    const value = localStorage.getItem(key);
    if (value && !isEncrypted(value)) {
      // 如果是未加密的，重新加密保存
      saveApiKey(key, value);
      console.log('API Key migrated to encrypted format');
    }
  } catch (error) {
    console.error('Failed to migrate API key:', error);
  }
}
