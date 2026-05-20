import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { FileState, AISettings, AIAdvancedSettings, TabType } from '../types';
import { useDebouncedLocalStorage } from '../hooks/useDebounce';
import { loadApiKey, saveApiKey, migrateApiKey } from '../utils/encryption';

interface AppContextType {
  // 文件状态
  files: FileState[];
  activeFileId: string | null;
  currentTab: TabType;

  // 文件夹状态
  folderPath: string | null;
  folderFiles: Array<{ name: string; path: string }>;

  // AI 状态
  aiSettings: AISettings;
  aiAdvancedSettings: AIAdvancedSettings;
  aiMessagesMap: Record<string, Array<{ role: 'user' | 'assistant'; content: string }>>;
  pendingAiContent: Record<string, string>;

  // 文件操作
  addFile: (file: FileState) => void;
  updateFile: (id: string, updates: Partial<FileState>) => void;
  removeFile: (id: string) => void;
  setActiveFile: (id: string | null) => void;
  setCurrentTab: (tab: TabType) => void;

  // 文件夹操作
  setFolderPath: (path: string | null) => void;
  setFolderFiles: (files: Array<{ name: string; path: string }> | ((prev: Array<{ name: string; path: string }>) => Array<{ name: string; path: string }>)) => void;

  // AI 操作
  setAiSettings: (settings: AISettings) => void;
  setAiAdvancedSettings: (settings: AIAdvancedSettings) => void;
  addAiMessage: (fileId: string, message: { role: 'user' | 'assistant'; content: string }) => void;
  setPendingContent: (fileId: string, content: string) => void;
  clearPendingContent: (fileId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // 文件状态
  const [files, setFiles] = useState<FileState[]>(() => {
    const saved = localStorage.getItem('mdparse-files');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('editor');

  // 文件夹状态
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<Array<{ name: string; path: string }>>([]);

  // AI 状态
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('mdparse-ai-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 迁移旧的未加密 API Key
        migrateApiKey('mdparse-ai-key');
        // 从加密存储中读取 API Key
        const apiKey = loadApiKey('mdparse-ai-key');
        return {
          ...parsed,
          apiKey: apiKey || parsed.apiKey || ''
        };
      } catch {
        return {
          apiKey: '',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-3.5-turbo',
          provider: 'openai'
        };
      }
    }
    return {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      provider: 'openai'
    };
  });

  const [aiAdvancedSettings, setAiAdvancedSettings] = useState<AIAdvancedSettings>(() => {
    const saved = localStorage.getItem('mdparse-ai-advanced');
    return saved ? JSON.parse(saved) : {
      temperature: 0.3,
      systemPrompt: '你是一个Markdown排版优化助手。用户会给你一段Markdown内容，你需要优化其排版，使其更符合Markdown语法规范，结构更清晰。直接返回优化后的内容，不要添加任何解释。'
    };
  });

  const [aiMessagesMap, setAiMessagesMap] = useState<Record<string, Array<{ role: 'user' | 'assistant'; content: string }>>>(() => {
    const saved = localStorage.getItem('mdparse-ai-messages');
    return saved ? JSON.parse(saved) : {};
  });

  const [pendingAiContent, setPendingAiContent] = useState<Record<string, string>>({});

  // 使用防抖持久化到 localStorage（延迟 1 秒写入，避免频繁操作）
  useDebouncedLocalStorage('mdparse-files', files, 1000);
  useDebouncedLocalStorage('mdparse-ai-advanced', aiAdvancedSettings, 500);
  useDebouncedLocalStorage('mdparse-ai-messages', aiMessagesMap, 2000); // AI 消息可能很大，延迟更长

  // AI Settings 需要特殊处理：API Key 单独加密存储
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // 保存 API Key 到加密存储
      if (aiSettings.apiKey) {
        saveApiKey('mdparse-ai-key', aiSettings.apiKey);
      }
      // 保存其他设置（不包含 API Key）
      const { apiKey, ...settingsWithoutKey } = aiSettings;
      localStorage.setItem('mdparse-ai-settings', JSON.stringify(settingsWithoutKey));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [aiSettings]);

  // 文件操作
  const addFile = useCallback((file: FileState) => {
    setFiles(prev => [...prev, file]);
    setActiveFileId(file.id);
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<FileState>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      if (id === activeFileId) {
        setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
        if (newFiles.length === 0) setCurrentTab('guide');
      }
      return newFiles;
    });
  }, [activeFileId]);

  const setActiveFile = useCallback((id: string | null) => {
    setActiveFileId(id);
  }, []);

  // AI 操作
  const addAiMessage = useCallback((fileId: string, message: { role: 'user' | 'assistant'; content: string }) => {
    setAiMessagesMap(prev => ({
      ...prev,
      [fileId]: [...(prev[fileId] || []), message]
    }));
  }, []);

  const setPendingContent = useCallback((fileId: string, content: string) => {
    setPendingAiContent(prev => ({ ...prev, [fileId]: content }));
  }, []);

  const clearPendingContent = useCallback((fileId: string) => {
    setPendingAiContent(prev => {
      const newMap = { ...prev };
      delete newMap[fileId];
      return newMap;
    });
  }, []);

  const value: AppContextType = {
    files,
    activeFileId,
    currentTab,
    folderPath,
    folderFiles,
    aiSettings,
    aiAdvancedSettings,
    aiMessagesMap,
    pendingAiContent,
    addFile,
    updateFile,
    removeFile,
    setActiveFile,
    setCurrentTab,
    setFolderPath,
    setFolderFiles,
    setAiSettings,
    setAiAdvancedSettings,
    addAiMessage,
    setPendingContent,
    clearPendingContent
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
