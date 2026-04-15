import { useState, useCallback, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MARKDOWN_GUIDE, ABOUT_CONTENT } from './data/markdownGuide';

// Electron API type
declare global {
  interface Window {
    electronAPI?: {
      saveFile: (data: { content: string; defaultName: string }) => Promise<{ success: boolean; path?: string }>;
      openFile: () => Promise<{ content: string; name: string; path: string } | null>;
      onFileOpened: (callback: (data: { content: string; name: string; path: string }) => void) => void;
      onMenuNewFile: (callback: () => void) => void;
      onMenuSaveFile: (callback: () => void) => void;
    };
  }
}

// Detect platform
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Types
type TabType = 'editor' | 'guide' | 'about';
type ThemeType = 'light' | 'dark';

interface FileState {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
}

interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: 'openai' | 'deepseek' | 'custom';
}

// Shortcut key display
const MOD_KEY = isMac ? '⌘' : 'Ctrl';

// Generate unique file ID
const generateFileId = () => Math.random().toString(36).substring(2, 9);

// All shortcuts
const SHORTCUTS = [
  { keys: `${MOD_KEY}+N`, action: '新建文件' },
  { keys: `${MOD_KEY}+S`, action: '保存文件' },
  { keys: `${MOD_KEY}+O`, action: '打开文件' },
  { keys: `${MOD_KEY}+W`, action: '关闭文件' },
  { keys: `${MOD_KEY}+Shift+T`, action: '切换主题' },
  { keys: `${MOD_KEY}+?`, action: '显示快捷键' },
  { keys: '', action: '' },
  { keys: `${MOD_KEY}+B`, action: '粗体' },
  { keys: `${MOD_KEY}+I`, action: '斜体' },
  { keys: `${MOD_KEY}+K`, action: '插入链接' },
  { keys: `${MOD_KEY}+` + '`', action: '行内代码' },
  { keys: `${MOD_KEY}+1`, action: '一级标题' },
  { keys: `${MOD_KEY}+2`, action: '二级标题' },
  { keys: `${MOD_KEY}+3`, action: '三级标题' },
  { keys: '', action: '' },
  { keys: 'Esc', action: '关闭弹窗' },
];

function App() {
  // Files state - array of open files
  const [files, setFiles] = useState<FileState[]>(() => {
    const saved = localStorage.getItem('mdparse-files');
    return saved ? JSON.parse(saved) : [];
  });

  // Active file ID
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Current tab
  const [currentTab, setCurrentTab] = useState<TabType>('editor');

  // Theme
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('mdparse-theme');
    return (saved as ThemeType) || 'light';
  });

  // New file dialog
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Shortcuts dialog
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Close confirm dialog
  const [closeConfirmDialog, setCloseConfirmDialog] = useState<{ show: boolean; fileId: string | null }>({ show: false, fileId: null });

  // File sidebar state
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isDragging, setIsDragging] = useState(false);

  // AI Panel state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
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
      systemPrompt: '你是一个Markdown排版优化助手。用户会给你一段Markdown内容，你需要优化其排版，使其更符合Markdown语法规范，结构更清晰。直接返回优化后的内容，不要添加任何解释。'
    };
  });
  const [aiMessagesMap, setAiMessagesMap] = useState<Record<string, { role: 'user' | 'assistant', content: string }[]>>({});
  const [pendingAiContent, setPendingAiContent] = useState<Record<string, string>>({});
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Get current file's AI messages
  const aiMessages = activeFileId ? (aiMessagesMap[activeFileId] || []) : [];
  const pendingContent = activeFileId ? (pendingAiContent[activeFileId] || '') : '';

  // Get active file
  const activeFile = files.find(f => f.id === activeFileId) || null;

  // Save files to localStorage when they change
  useEffect(() => {
    localStorage.setItem('mdparse-files', JSON.stringify(files));
  }, [files]);

  // Save theme
  useEffect(() => {
    localStorage.setItem('mdparse-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Save AI settings
  useEffect(() => {
    localStorage.setItem('mdparse-ai-settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // Save AI advanced settings
  useEffect(() => {
    localStorage.setItem('mdparse-ai-advanced', JSON.stringify(aiAdvancedSettings));
  }, [aiAdvancedSettings]);

  // Handle sidebar resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newWidth = Math.max(150, Math.min(400, e.clientX));
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Insert text at cursor (for formatting shortcuts)
  const insertTextAtCursor = useCallback((before: string, after: string = '') => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => {
      if (f.id === activeFileId) {
        return {
          ...f,
          content: f.content + '\n' + before + '文本' + after,
          isDirty: true
        };
      }
      return f;
    }));
  }, [activeFileId]);

  // Handle file loaded
  const handleFileLoaded = useCallback((content: string, name: string) => {
    const newFile: FileState = {
      id: generateFileId(),
      name,
      content,
      isDirty: false
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setCurrentTab('editor');
  }, []);

  // Handle new file
  const handleNewFile = useCallback(() => {
    setNewFileName('新文档.md');
    setShowNewFileDialog(true);
  }, []);

  // Confirm new file
  const confirmNewFile = useCallback(() => {
    const name = newFileName.trim() || '未命名.md';
    const finalName = name.endsWith('.md') ? name : name + '.md';
    const newFile: FileState = {
      id: generateFileId(),
      name: finalName,
      content: '# ' + finalName.replace('.md', '') + '\n\n开始编写你的内容...\n',
      isDirty: false
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setCurrentTab('editor');
    setShowNewFileDialog(false);
    setNewFileName('');
  }, [newFileName]);

  // Cancel new file
  const cancelNewFile = useCallback(() => {
    setShowNewFileDialog(false);
    setNewFileName('');
  }, []);

  // Handle content change
  const handleContentChange = useCallback((content: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f =>
      f.id === activeFileId ? { ...f, content, isDirty: true } : f
    ));
  }, [activeFileId]);

  // Handle rename file
  const handleRenameFile = useCallback((newName: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f =>
      f.id === activeFileId ? { ...f, name: newName } : f
    ));
  }, [activeFileId]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!activeFile) return;

    const currentFile = activeFile;

    // Try Electron API first
    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile({
        content: currentFile.content,
        defaultName: currentFile.name
      });
      if (result.success) {
        setFiles(prev => prev.map(f =>
          f.id === activeFileId ? { ...f, isDirty: false } : f
        ));
        return;
      }
    }

    // Fallback to browser download
    const blob = new Blob([currentFile.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFiles(prev => prev.map(f =>
      f.id === activeFileId ? { ...f, isDirty: false } : f
    ));
  }, [activeFile, activeFileId]);

  // Handle close file
  const handleCloseFileById = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    // If file has unsaved changes, show confirm dialog
    if (file?.isDirty) {
      setCloseConfirmDialog({ show: true, fileId });
      return;
    }
    // Otherwise close directly
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      // If no files left, switch to guide/about
      if (newFiles.length === 0) {
        setCurrentTab('guide');
        setActiveFileId(null);
      } else if (fileId === activeFileId) {
        // If closing active file, switch to first remaining file
        setActiveFileId(newFiles[0].id);
      }
      return newFiles;
    });
  }, [files, activeFileId]);

  // Handle close current file
  const handleCloseFile = useCallback(() => {
    if (!activeFileId) return;
    handleCloseFileById(activeFileId);
  }, [activeFileId, handleCloseFileById]);

  // Toggle theme
  const handleOpenFile = useCallback(async () => {
    // Try Electron API first
    if (window.electronAPI) {
      const result = await window.electronAPI.openFile();
      if (result) {
        const newFile: FileState = {
          id: generateFileId(),
          name: result.name,
          content: result.content,
          isDirty: false
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
        setCurrentTab('editor');
        return;
      }
    }

    // Fallback to browser file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md';
    input.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const newFile: FileState = {
            id: generateFileId(),
            name: file.name,
            content,
            isDirty: false
          };
          setFiles(prev => [...prev, newFile]);
          setActiveFileId(newFile.id);
          setCurrentTab('editor');
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Toggle shortcuts
  const toggleShortcuts = useCallback(() => {
    setShowShortcuts(prev => !prev);
  }, []);

  // Handle AI submit
  const handleAISubmit = useCallback(async () => {
    if (!aiInput.trim() || !aiSettings.apiKey || !activeFile || !activeFileId) return;

    const userMessage = aiInput.trim();
    setAiInput('');

    // Add user message to current file's messages
    setAiMessagesMap(prev => ({
      ...prev,
      [activeFileId]: [...(prev[activeFileId] || []), { role: 'user', content: userMessage }]
    }));

    setAiLoading(true);

    try {
      // Build the API URL
      const apiUrl = aiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions';

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

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
              content: aiAdvancedSettings.systemPrompt
            },
            {
              role: 'user',
              content: `请优化以下Markdown文件的排版：\n\n${activeFile.content}\n\n用户需求：${userMessage}`
            }
          ],
          temperature: aiAdvancedSettings.temperature
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API请求失败 (${response.status})`);
      }

      const data = await response.json();
      const optimizedContent = data.choices[0]?.message?.content || '';

      if (optimizedContent) {
        // Store pending content for user confirmation, don't update file directly
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
      if (error instanceof Error && error.name === 'AbortError') {
        setAiMessagesMap(prev => ({
          ...prev,
          [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: '请求超时，请检查网络或尝试更短的文本。' }]
        }));
      } else {
        setAiMessagesMap(prev => ({
          ...prev,
          [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: `错误: ${(error as Error).message}` }]
        }));
      }
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiSettings, activeFile, activeFileId, aiAdvancedSettings]);

  // Handle apply AI content
  const handleApplyAiContent = useCallback(() => {
    if (!activeFileId || !pendingAiContent[activeFileId]) return;

    setFiles(prev => prev.map(f =>
      f.id === activeFileId ? { ...f, content: pendingAiContent[activeFileId], isDirty: true } : f
    ));

    // Clear pending content
    setPendingAiContent(prev => {
      const newMap = { ...prev };
      delete newMap[activeFileId];
      return newMap;
    });

    // Add confirmation message
    setAiMessagesMap(prev => ({
      ...prev,
      [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: '已应用优化内容到文件。' }]
    }));
  }, [activeFileId, pendingAiContent]);

  // Handle dismiss AI content
  const handleDismissAiContent = useCallback(() => {
    if (!activeFileId) return;

    // Clear pending content
    setPendingAiContent(prev => {
      const newMap = { ...prev };
      delete newMap[activeFileId];
      return newMap;
    });

    // Add dismiss message
    setAiMessagesMap(prev => ({
      ...prev,
      [activeFileId]: [...(prev[activeFileId] || []), { role: 'assistant', content: '已放弃本次优化内容。' }]
    }));
  }, [activeFileId]);

  // Handle provider change
  const handleProviderChange = useCallback((provider: string) => {
    const baseUrls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
      custom: ''
    };
    setAiSettings((prev: AISettings): AISettings => ({
      ...prev,
      provider: provider as AISettings['provider'],
      baseUrl: baseUrls[provider] || prev.baseUrl,
      model: provider === 'deepseek' ? 'deepseek-chat' : (provider === 'openai' ? 'gpt-3.5-turbo' : prev.model)
    }));
  }, []);

  // Register Electron menu callbacks
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onFileOpened((data) => {
        const newFile: FileState = {
          id: generateFileId(),
          name: data.name,
          content: data.content,
          isDirty: false
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
        setCurrentTab('editor');
      });
      window.electronAPI.onMenuNewFile(() => {
        handleNewFile();
      });
      window.electronAPI.onMenuSaveFile(() => {
        handleSave();
      });
    }
  }, [handleNewFile, handleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Allow Escape to close dialogs
        if (e.key === 'Escape') {
          if (showNewFileDialog) cancelNewFile();
          if (showShortcuts) setShowShortcuts(false);
        }
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handleNewFile();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'o':
            e.preventDefault();
            handleOpenFile();
            break;
          case 'w':
            e.preventDefault();
            handleCloseFile();
            break;
          case 't':
            if (e.shiftKey) {
              e.preventDefault();
              toggleTheme();
            }
            break;
          case '?':
            e.preventDefault();
            toggleShortcuts();
            break;
          case 'b':
            e.preventDefault();
            insertTextAtCursor('**', '**');
            break;
          case 'i':
            e.preventDefault();
            insertTextAtCursor('*', '*');
            break;
          case 'k':
            e.preventDefault();
            insertTextAtCursor('[', '](url)');
            break;
          case '`':
            e.preventDefault();
            insertTextAtCursor('`', '`');
            break;
          case '1':
          case '2':
          case '3':
            e.preventDefault();
            const level = parseInt(e.key);
            insertTextAtCursor('#'.repeat(level) + ' ');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewFile, handleSave, handleOpenFile, handleCloseFile, toggleTheme, toggleShortcuts, insertTextAtCursor, showNewFileDialog, showShortcuts, cancelNewFile]);

  const isDark = theme === 'dark';

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header - Fixed layout */}
      <header className={`flex-shrink-0 border-b flex items-center justify-between px-4 h-14 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Left: Logo + App Name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Markdown Reader</span>
          {isMac && <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>macOS</span>}
        </div>

        {/* Center: Main tabs */}
        <div className="flex-1 flex items-center justify-center gap-2 mx-4">
          {/* Main tab navigation */}
          <div className={`flex items-center rounded-lg p-0.5 flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {(['editor', 'guide', 'about'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${
                  currentTab === tab
                    ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'editor' ? '编辑器' : tab === 'guide' ? '语法指南' : '关于'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleNewFile}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            title={`新建文件 (${MOD_KEY}+N)`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            onClick={toggleShortcuts}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            title={`快捷键 (${MOD_KEY}+?)`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* AI Button */}
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`p-2 rounded-lg transition-colors ${showAIPanel ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white') : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}`}
            title="AI 优化"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            title={`切换主题 (${MOD_KEY}+Shift+T)`}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main content with sidebar and AI panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Sidebar - Left */}
        {showFileSidebar && (
          <div
            className={`flex flex-col border-r ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{ width: sidebarWidth }}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>文件</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewFile}
                  className={`p-1 rounded ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="新建文件"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowFileSidebar(false)}
                  className={`p-1 rounded ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="隐藏侧边栏"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-auto">
              {files.length === 0 ? (
                <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  暂无打开的文件
                </div>
              ) : (
                <div className="py-1">
                  {files.map(file => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setActiveFileId(file.id);
                        setCurrentTab('editor');
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        activeFileId === file.id
                          ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white')
                          : (isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate flex-1">{file.name}</span>
                      {file.isDirty && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseFileById(file.id);
                        }}
                        className={`p-1 rounded opacity-60 hover:opacity-100 ${activeFileId === file.id ? 'hover:bg-white/20' : ''}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resize handle */}
        {showFileSidebar && (
          <div
            className={`w-1 cursor-col-resize hover:bg-emerald-500 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            onMouseDown={() => setIsDragging(true)}
          />
        )}

        {/* Toggle sidebar button when hidden */}
        {!showFileSidebar && (
          <button
            onClick={() => setShowFileSidebar(true)}
            className={`absolute left-2 top-20 p-2 rounded-lg shadow-lg z-10 ${isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'}`}
            title="显示文件侧边栏"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-hidden p-2">
          {currentTab === 'editor' && (
          activeFile ? (
            <div className={`h-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <MarkdownEditor
                content={activeFile.content}
                fileName={activeFile.name}
                onContentChange={handleContentChange}
                onClose={handleCloseFile}
                onSave={handleSave}
                onRename={handleRenameFile}
                theme={theme}
                isMac={isMac}
              />
            </div>
          ) : (
            <div className="py-16">
              <div className="text-center mb-10">
                <h1 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Markdown 阅读器</h1>
                <p className="text-gray-500 text-lg">阅读、编辑、创建 Markdown 文档</p>
              </div>
              <FileUploader onFileLoaded={handleFileLoaded} theme={theme} />
            </div>
          )
        )}

        {currentTab === 'guide' && (
          <div className={`h-full overflow-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <MarkdownContent content={MARKDOWN_GUIDE} theme={theme} />
          </div>
        )}

        {currentTab === 'about' && (
          <div className={`h-full overflow-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <MarkdownContent content={ABOUT_CONTENT} theme={theme} />
          </div>
        )}
        </main>

        {/* AI Panel - Right sidebar */}
        {showAIPanel && (
          <div className={`w-80 border-l flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI 优化</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowAISettings(!showAISettings)}
                    className={`p-1 rounded ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    title="AI 设置"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button onClick={() => setShowAIPanel(false)} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Current file indicator */}
              {activeFile && (
                <div className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  当前文件: {activeFile.name}
                </div>
              )}
            </div>

            {/* AI Settings - Collapsible */}
            {showAISettings && (
              <div className="p-3 border-b border-gray-700 space-y-3">
                {/* Provider */}
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>服务商</label>
                  <div className="flex gap-2">
                    {['openai', 'deepseek', 'custom'].map(p => (
                      <button
                        key={p}
                        onClick={() => handleProviderChange(p)}
                        className={`flex-1 py-1.5 px-2 text-sm rounded-lg border transition-colors ${
                          aiSettings.provider === p
                            ? (isDark ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-500 border-emerald-400 text-white')
                            : (isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100')
                        }`}
                      >
                        {p === 'openai' ? 'OpenAI' : p === 'deepseek' ? 'DeepSeek' : '自定义'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base URL */}
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Base URL</label>
                  <input
                    type="text"
                    value={aiSettings.baseUrl}
                    onChange={e => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* API Key */}
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>API Key</label>
                  <input
                    type="password"
                    value={aiSettings.apiKey}
                    onChange={e => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Model */}
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>模型名称</label>
                  <input
                    type="text"
                    value={aiSettings.model}
                    onChange={e => setAiSettings({ ...aiSettings, model: e.target.value })}
                    placeholder="gpt-3.5-turbo"
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Test Connection Button */}
                <button
                  onClick={async () => {
                    if (!aiSettings.apiKey || !aiSettings.baseUrl || !aiSettings.model) {
                      setAiTestResult({ success: false, message: '请填写 API Key、Base URL 和模型名称' });
                      return;
                    }
                    setAiTesting(true);
                    setAiTestResult(null);
                    try {
                      const apiUrl = aiSettings.baseUrl.replace(/\/$/, '') + '/models';
                      const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${aiSettings.apiKey}`
                        }
                      });
                      if (response.ok) {
                        setAiTestResult({ success: true, message: '连接成功！API 配置正确。' });
                      } else {
                        const err = await response.json().catch(() => ({}));
                        setAiTestResult({ success: false, message: `连接失败: ${response.status} ${err.error?.message || ''}` });
                      }
                    } catch (error) {
                      setAiTestResult({ success: false, message: `连接失败: ${(error as Error).message}` });
                    } finally {
                      setAiTesting(false);
                    }
                  }}
                  disabled={aiTesting}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    aiTesting
                      ? (isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                      : (isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                  }`}
                >
                  {aiTesting ? '测试中...' : '测试连接'}
                </button>

                {/* Test Result */}
                {aiTestResult && (
                  <div className={`text-sm px-3 py-2 rounded-lg ${aiTestResult.success ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700') : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700')}`}>
                    {aiTestResult.message}
                  </div>
                )}

                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Temperature</label>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{aiAdvancedSettings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={aiAdvancedSettings.temperature}
                    onChange={e => setAiAdvancedSettings({ ...aiAdvancedSettings, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* System Prompt */}
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>系统提示词</label>
                  <textarea
                    value={aiAdvancedSettings.systemPrompt}
                    onChange={e => setAiAdvancedSettings({ ...aiAdvancedSettings, systemPrompt: e.target.value })}
                    placeholder="你是一个Markdown排版优化助手..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border resize-none ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-1 overflow-auto p-3 space-y-3">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`text-sm ${msg.role === 'user' ? (isDark ? 'text-gray-300' : 'text-gray-700') : (isDark ? 'text-emerald-400' : 'text-emerald-600')}`}>
                  <div className="font-medium mb-1">{msg.role === 'user' ? '你' : 'AI'}</div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
              {aiLoading && (
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI 正在思考...</div>
              )}
              {pendingContent && (
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="font-medium mb-2 text-emerald-500">待应用优化内容：</div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} whitespace-pre-wrap max-h-60 overflow-auto`}>
                    {pendingContent}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleApplyAiContent}
                      className="flex-1 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600"
                    >
                      应用到文件
                    </button>
                    <button
                      onClick={handleDismissAiContent}
                      className={`flex-1 py-1.5 text-sm rounded-lg ${isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      放弃
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-700">
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAISubmit();
                  }
                }}
                placeholder="输入优化指令，如：优化这段Markdown的排版..."
                className={`w-full px-3 py-2 text-sm rounded-lg border resize-none ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                rows={3}
              />
              <button
                onClick={handleAISubmit}
                disabled={aiLoading || !aiInput.trim() || !aiSettings.apiKey || !activeFile}
                className={`w-full mt-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  aiLoading || !aiInput.trim() || !aiSettings.apiKey || !activeFile
                    ? (isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {aiLoading ? '处理中...' : '优化当前文件'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-96 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>新建文件</h3>
            <input
              type="text"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmNewFile();
                if (e.key === 'Escape') cancelNewFile();
              }}
              placeholder="输入文件名"
              autoFocus
              className={`w-full px-4 py-2 border rounded-lg mb-4 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelNewFile}
                className={`px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                取消
              </button>
              <button
                onClick={confirmNewFile}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Dialog */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className={`rounded-xl p-6 w-80 max-h-[80vh] overflow-auto ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>快捷键</h3>
              <button onClick={() => setShowShortcuts(false)} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} hover:text-gray-700`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map((shortcut, i) => (
                shortcut.keys ? (
                  <div key={i} className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{shortcut.action}</span>
                    <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{shortcut.keys}</kbd>
                  </div>
                ) : (
                  <div key={i} className="border-t my-2" />
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Close Confirm Dialog */}
      {closeConfirmDialog.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-96 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>文件未保存</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>文件尚未保存，是否保存后再关闭？</p>
            <div className="flex gap-2">
              <button onClick={async () => {
                await handleSave();
                setCloseConfirmDialog({ show: false, fileId: null });
                if (closeConfirmDialog.fileId) {
                  setFiles(prev => prev.filter(f => f.id !== closeConfirmDialog.fileId));
                  if (closeConfirmDialog.fileId === activeFileId) {
                    const remaining = files.filter(f => f.id !== closeConfirmDialog.fileId);
                    setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
                    if (remaining.length === 0) setCurrentTab('guide');
                  }
                }
              }} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">保存并关闭</button>
              <button onClick={() => {
                if (closeConfirmDialog.fileId) {
                  setFiles(prev => prev.filter(f => f.id !== closeConfirmDialog.fileId));
                  if (closeConfirmDialog.fileId === activeFileId) {
                    const remaining = files.filter(f => f.id !== closeConfirmDialog.fileId);
                    setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
                    if (remaining.length === 0) setCurrentTab('guide');
                  }
                }
                setCloseConfirmDialog({ show: false, fileId: null });
              }} className={`flex-1 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>不保存</button>
              <button onClick={() => setCloseConfirmDialog({ show: false, fileId: null })} className={`flex-1 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

function MarkdownContent({ content, theme }: { content: string; theme: ThemeType }) {
  const [copied, setCopied] = useState<string | null>(null);
  const syntaxStyle = theme === 'dark' ? oneDark : oneLight;

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const isDark = theme === 'dark';

  const proseStyles = isDark
    ? `prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-a:text-teal-300 prose-code:text-emerald-300 prose-code:bg-gray-700 prose-pre:bg-gray-900 prose-blockquote:border-teal-400 prose-blockquote:bg-gray-800 prose-blockquote:text-white prose-th:bg-gray-700 prose-th:text-white prose-th:border-gray-600 prose-td:text-white prose-td:border-gray-600 prose-li:marker:text-teal-300 prose-hr:border-gray-500`
    : `prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-900 prose-em:text-gray-700 prose-a:text-teal-600 prose-code:text-teal-600 prose-code:bg-teal-50 prose-pre:bg-gray-900 prose-blockquote:border-teal-400 prose-blockquote:bg-teal-50 prose-blockquote:text-gray-700 prose-th:bg-gray-50 prose-th:text-gray-900 prose-th:border-gray-200 prose-td:text-gray-600 prose-td:border-gray-200 prose-li:marker:text-teal-400 prose-hr:border-gray-200`;

  return (
    <div className={`prose prose-lg max-w-none ${proseStyles}`}>
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return <code className={className} {...props}>{children}</code>;
            }

            const codeString = String(children).replace(/\n$/, '');
            const language = match[1] || 'text';
            const codeId = `code-${language}-${codeString.slice(0, 20)}`;

            return (
              <div className="relative group">
                <button
                  onClick={() => handleCopy(codeString, codeId)}
                  className={`absolute top-3 right-3 px-2 py-1 text-xs rounded transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 ${
                    isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {copied === codeId ? '已复制' : '复制'}
                </button>
                <SyntaxHighlighter
                  style={syntaxStyle}
                  language={language}
                  PreTag="div"
                  customStyle={{ margin: '1.5em 0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                  showLineNumbers
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default App;