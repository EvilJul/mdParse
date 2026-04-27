import { useState, useCallback, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownContent } from './components/MarkdownContent';
import { FileTabs } from './components/FileTabs';
import { SearchReplace } from './components/SearchReplace';
import { SettingsModal } from './components/modals/SettingsModal';
import { NewFileDialog } from './components/modals/NewFileDialog';
import { ConfirmDialog } from './components/modals/ConfirmDialog';
import { MARKDOWN_GUIDE, ABOUT_CONTENT } from './data/markdownGuide';
import type { FileState, AISettings, TabType } from './types';
import { generateFileId, isMac } from './utils/helpers';
import { SHORTCUTS } from './constants/shortcuts';
import { useTheme } from './hooks/useTheme';
import { useSidebar } from './hooks/useSidebar';
import { useModals } from './hooks/useModals';
import { useAutoSave } from './hooks/useAutoSave';

// Electron API type
declare global {
  interface Window {
    electronAPI?: {
      saveFile: (data: { content: string; defaultName: string }) => Promise<{ success: boolean; path?: string }>;
      saveDirectFile: (data: { content: string; filePath: string }) => Promise<{ success: boolean }>;
      openFile: () => Promise<{ content: string; name: string; path: string } | null>;
      openFolder: () => Promise<{ success: boolean; folderPath?: string; files?: Array<{ name: string; path: string; content: string }> } | null>;
      readFileFromPath: (filePath: string) => Promise<string | null>;
      renameFile: (oldPath: string, newPath: string) => Promise<boolean>;
      deleteFile: (filePath: string) => Promise<boolean>;
      onFileOpened: (callback: (data: { content: string; name: string; path: string }) => void) => () => void;
      onMenuNewFile: (callback: () => void) => () => void;
      onMenuSaveFile: (callback: () => void) => () => void;
      onMenuSaveAsFile: (callback: () => void) => () => void;
      onMenuOpenFolder: (callback: () => void) => () => void;
      onMenuOpenAISettings: (callback: () => void) => () => void;
      onMenuOpenSettings: (callback: () => void) => () => void;
      onMenuOpenGuide: (callback: () => void) => () => void;
      onMenuOpenShortcuts: (callback: () => void) => () => void;
    };
  }
}

function App() {
  // Custom hooks
  const { theme, setTheme, fontSize, setFontSize, toggleTheme: handleToggleTheme, isDark } = useTheme();
  const { showFileSidebar, setShowFileSidebar, sidebarWidth, startDragging } = useSidebar();
  const {
    showNewFileDialog, setShowNewFileDialog,
    showShortcuts, setShowShortcuts,
    showHelpMenu, setShowHelpMenu,
    showGuideModal, setShowGuideModal,
    showAboutModal, setShowAboutModal,
    showSettingsModal, setShowSettingsModal,
    showPreviewModal, setShowPreviewModal,
    showAIPanel, setShowAIPanel,
    showAIModal, setShowAIModal,
    closeConfirmDialog, setCloseConfirmDialog,
    contextMenu, setContextMenu
  } = useModals();

  // Files state - array of open files
  const [files, setFiles] = useState<FileState[]>(() => {
    const saved = localStorage.getItem('mdparse-files');
    return saved ? JSON.parse(saved) : [];
  });

  // Active file ID
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Current tab
  const [currentTab, setCurrentTab] = useState<TabType>('editor');

  // Search and Replace
  const [showSearchReplace, setShowSearchReplace] = useState(false);

  // New file dialog
  const [newFileName, setNewFileName] = useState('');

  // Folder view state
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<Array<{ name: string; path: string }>>([]);
  const [isOpeningFolder, setIsOpeningFolder] = useState(false);
  const [renamingFile, setRenamingFile] = useState<{ name: string; path: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ name: string; path: string } | null>(null);

  // AI Panel state
  const [isSaving, setIsSaving] = useState(false);
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
  const [aiMessagesMap, setAiMessagesMap] = useState<Record<string, { role: 'user' | 'assistant', content: string }[]>>(() => {
    const saved = localStorage.getItem('mdparse-ai-messages');
    return saved ? JSON.parse(saved) : {};
  });
  const [pendingAiContent, setPendingAiContent] = useState<Record<string, string>>({});
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreviewZoom, setAiPreviewZoom] = useState(100);

  // Get current file's AI messages
  const aiMessages = activeFileId ? (aiMessagesMap[activeFileId] || []) : [];
  const pendingContent = activeFileId ? (pendingAiContent[activeFileId] || '') : '';

  // Get active file
  const activeFile = files.find(f => f.id === activeFileId) || null;

  // Auto-save
  const { lastSaved, isSaving: isAutoSaving } = useAutoSave({
    enabled: !!activeFile && activeFile.isDirty && !!activeFile.filePath,
    interval: 30000,
    onSave: async () => {
      if (activeFile && activeFile.filePath && window.electronAPI) {
        await window.electronAPI.saveDirectFile({
          content: activeFile.content,
          filePath: activeFile.filePath
        });
        setFiles(prev => prev.map(f =>
          f.id === activeFile.id ? { ...f, isDirty: false } : f
        ));
      }
    }
  });

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

  // Save AI messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem('mdparse-ai-messages', JSON.stringify(aiMessagesMap));
  }, [aiMessagesMap]);

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
  const handleFileLoaded = useCallback((content: string, name: string, filePath?: string) => {
    const newFile: FileState = {
      id: generateFileId(),
      name,
      content,
      isDirty: false,
      filePath
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

  // Handle save (overwrite) - improved error handling
  const handleSave = useCallback(async () => {
    if (!activeFile || isSaving) return;
    setIsSaving(true);

    try {
      const currentFile = activeFile;

      // If file has a path, try to save directly
      if (currentFile.filePath && window.electronAPI) {
        const result = await window.electronAPI.saveDirectFile({
          content: currentFile.content,
          filePath: currentFile.filePath
        });

        if (result.success) {
          setFiles(prev => prev.map(f =>
            f.id === activeFileId ? { ...f, isDirty: false } : f
          ));
          return;
        }
        // If direct save fails, fall through to save as dialog
        console.warn('Direct save failed, falling back to save as dialog');
      }

      // Fallback to save as dialog
      await handleSaveAs();
    } catch (error) {
      console.error('Save failed:', error);
      // Show error to user (you could add a toast notification here)
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, activeFileId, isSaving]);

  // Handle save as - improved error handling
  const handleSaveAs = useCallback(async () => {
    if (!activeFile || isSaving) return;
    setIsSaving(true);

    try {
      const currentFile = activeFile;

      if (window.electronAPI) {
        const result = await window.electronAPI.saveFile({
          content: currentFile.content,
          defaultName: currentFile.name
        });

        if (result.success && result.path) {
          // Extract filename from path
          const fileName = result.path.split(/[\\/]/).pop() || currentFile.name;
          // Update the file with the new path
          setFiles(prev => prev.map(f =>
            f.id === activeFileId ? { ...f, isDirty: false, filePath: result.path, name: fileName } : f
          ));
          return;
        }

        // If Electron save failed or was cancelled, don't fall through to browser download
        if (!result.success) {
          console.log('Save cancelled by user');
          return;
        }
      }

      // Fallback to browser download (only if not in Electron)
      if (!window.electronAPI) {
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
      }
    } catch (error) {
      console.error('Save as failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, activeFileId, isSaving]);

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
      // If no files left, reset to initial state
      if (newFiles.length === 0) {
        setCurrentTab('guide'); // Set to guide so FileUploader shows
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

  // Close all files from the folder
  const closeFolderFiles = useCallback(() => {
    const folderFilePaths = folderFiles.map(f => f.path);
    setFiles(prev => {
      const newFiles = prev.filter(f => !f.filePath || !folderFilePaths.includes(f.filePath));
      // If no files left, show welcome screen
      if (newFiles.length === 0) {
        setActiveFileId(null);
      } else if (activeFileId && !newFiles.find(f => f.id === activeFileId)) {
        setActiveFileId(newFiles[0].id);
      }
      return newFiles;
    });
    setFolderPath(null);
    setFolderFiles([]);
  }, [folderFiles, activeFileId]);

  // Handle rename submit
  const handleRenameSubmit = useCallback(async () => {
    if (!renameTarget || !renameValue || renameValue === renameTarget.name) {
      setShowRenameDialog(false);
      setRenameTarget(null);
      return;
    }

    const newPath = renameTarget.path.replace(renameTarget.name, renameValue);
    if (window.electronAPI) {
      const success = await window.electronAPI.renameFile(renameTarget.path, newPath);
      if (success) {
        setFolderFiles(prev => prev.map(f =>
          f.path === renameTarget.path ? { ...f, name: renameValue, path: newPath } : f
        ));
        setFiles(prev => prev.map(f =>
          f.filePath === renameTarget.path ? { ...f, name: renameValue, filePath: newPath } : f
        ));
      } else {
        alert('重命名失败');
      }
    }
    setShowRenameDialog(false);
    setRenameTarget(null);
  }, [renameTarget, renameValue]);

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

  // Toggle shortcuts
  const toggleShortcuts = useCallback(() => {
    setShowShortcuts(prev => !prev);
  }, []);

  // Handle open folder
  const handleOpenFolder = useCallback(async () => {
    // Prevent multiple simultaneous folder open operations
    if (isOpeningFolder) return;
    setIsOpeningFolder(true);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.openFolder();
        if (result && result.success && result.files && result.folderPath) {
          // Add all files from the folder
          const newFiles = result.files.map((file: { name: string; path: string; content: string }) => ({
            id: generateFileId(),
            name: file.name,
            content: file.content,
            isDirty: false,
            filePath: file.path
          }));
          setFiles(prev => [...prev, ...newFiles]);
          setFolderPath(result.folderPath);
          setFolderFiles(result.files.map((f: { name: string; path: string }) => ({ name: f.name, path: f.path })));
          if (newFiles.length > 0) {
            setActiveFileId(newFiles[0].id);
            setCurrentTab('editor');
          }
        }
      }
    } finally {
      // Reset the flag after a short delay to prevent rapid clicks
      setTimeout(() => setIsOpeningFolder(false), 300);
    }
  }, [isOpeningFolder]);

  // Handle AI submit - improved error handling and timeout
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

      // Create abort controller for timeout - 120 seconds
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
              content: aiAdvancedSettings.systemPrompt || '你是一个Markdown排版优化助手。用户会给你一段Markdown内容，你需要优化其排版，使其更符合Markdown语法规范，结构更清晰。直接返回优化后的内容，不要添加任何解释。'
            },
            {
              role: 'user',
              content: `请优化以下Markdown文件的排版：\n\n${activeFile.content}\n\n用户需求：${userMessage}`
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

  // Register Electron menu callbacks
  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanups: Array<() => void> = [];

    cleanups.push(window.electronAPI.onFileOpened((data) => {
      const newFile: FileState = {
        id: generateFileId(),
        name: data.name,
        content: data.content,
        isDirty: false
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setCurrentTab('editor');
    }));

    cleanups.push(window.electronAPI.onMenuNewFile(() => {
      handleNewFile();
    }));

    cleanups.push(window.electronAPI.onMenuSaveFile(() => {
      handleSave();
    }));

    cleanups.push(window.electronAPI.onMenuSaveAsFile(() => {
      handleSaveAs();
    }));

    cleanups.push(window.electronAPI.onMenuOpenFolder(() => {
      handleOpenFolder();
    }));

    cleanups.push(window.electronAPI.onMenuOpenSettings(() => {
      console.log('Settings menu clicked - opening settings modal');
      setShowSettingsModal(true);
    }));

    if (window.electronAPI.onMenuOpenGuide) {
      cleanups.push(window.electronAPI.onMenuOpenGuide(() => {
        setShowGuideModal(true);
      }));
    }

    if (window.electronAPI.onMenuOpenShortcuts) {
      cleanups.push(window.electronAPI.onMenuOpenShortcuts(() => {
        setShowShortcuts(true);
      }));
    }

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [handleNewFile, handleSave, handleSaveAs, handleOpenFolder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Allow Escape to close dialogs
        if (e.key === 'Escape') {
          if (showNewFileDialog) cancelNewFile();
          if (showShortcuts) setShowShortcuts(false);
          if (showHelpMenu) setShowHelpMenu(false);
          if (showGuideModal) setShowGuideModal(false);
          if (showAboutModal) setShowAboutModal(false);
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
            if (e.shiftKey) {
              handleSaveAs();
            } else {
              handleSave();
            }
            break;
          case 'o':
            e.preventDefault();
            if (e.shiftKey) {
              handleOpenFolder();
            } else {
              handleOpenFile();
            }
            break;
          case 'w':
            e.preventDefault();
            handleCloseFile();
            break;
          case 'f':
            e.preventDefault();
            setShowSearchReplace(true);
            break;
          case 'h':
            e.preventDefault();
            setShowSearchReplace(true);
            break;
          case 't':
            if (e.shiftKey) {
              e.preventDefault();
              handleToggleTheme();
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
  }, [handleNewFile, handleSave, handleSaveAs, handleOpenFile, handleOpenFolder, handleCloseFile, handleToggleTheme, toggleShortcuts, insertTextAtCursor, showNewFileDialog, showShortcuts, showHelpMenu, cancelNewFile, setShowHelpMenu]);

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Auto-save indicator */}
      {isAutoSaving && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg bg-emerald-500 text-white text-sm flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          自动保存中...
        </div>
      )}
      {lastSaved && !isAutoSaving && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg bg-gray-700 text-white text-sm opacity-75">
          已保存 {new Date(lastSaved).toLocaleTimeString()}
        </div>
      )}

      {/* Floating AI Button */}
      {!showAIPanel && (
        <button
          onClick={() => setShowAIPanel(true)}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white shadow-2xl hover:shadow-emerald-500/30 hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 ai-float-btn"
          title="AI 助手"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="9" cy="10" r="1"/>
            <circle cx="15" cy="10" r="1"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          </svg>
        </button>
      )}

      {/* Main content with sidebar and AI panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Sidebar - Left */}
        {showFileSidebar && (
          <div
            className={`flex flex-col border-r transition-all duration-300 ease-out ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{ width: sidebarWidth }}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50">
              <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>文件</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewFile}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                  title="新建文件"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setShowFileSidebar(false);
                  }}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                  title="隐藏侧边栏"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Unified file list - folder files + opened files */}
            <div className="flex-1 overflow-auto p-2">
              {folderPath && (
                <div className={`flex items-center gap-2 px-3 py-2.5 mb-1 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className={`text-sm font-medium truncate flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {folderPath.split(/[\\/]/).pop()}
                  </span>
                  <button
                    onClick={async () => {
                      // Check for unsaved files from this folder
                      const folderFilePaths = folderFiles.map(f => f.path);
                      const unsavedFiles = files.filter(f => f.filePath && folderFilePaths.includes(f.filePath) && f.isDirty);

                      if (unsavedFiles.length > 0) {
                        const fileNames = unsavedFiles.map(f => f.name).join(', ');
                        const shouldSave = confirm(`以下文件有未保存的更改，是否保存？\n${fileNames}`);

                        if (shouldSave) {
                          // Save all unsaved files first
                          const savePromises = unsavedFiles.map(async (file) => {
                            if (file.filePath && window.electronAPI) {
                              try {
                                const result = await window.electronAPI.saveDirectFile({
                                  content: file.content,
                                  filePath: file.filePath
                                });
                                return { fileId: file.id, success: result.success };
                              } catch (error) {
                                console.error(`Failed to save ${file.name}:`, error);
                                return { fileId: file.id, success: false };
                              }
                            }
                            return { fileId: file.id, success: false };
                          });

                          const results = await Promise.all(savePromises);
                          const savedFileIds = results.filter(r => r.success).map(r => r.fileId);

                          // Mark successfully saved files as not dirty
                          if (savedFileIds.length > 0) {
                            setFiles(prev => prev.map(f =>
                              savedFileIds.includes(f.id) ? { ...f, isDirty: false } : f
                            ));
                          }

                          // Warn about failed saves
                          const failedCount = results.length - savedFileIds.length;
                          if (failedCount > 0) {
                            alert(`${failedCount} 个文件保存失败`);
                          }
                        }
                      }

                      closeFolderFiles();
                    }}
                    className={`p-1 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-600/50 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200/50 text-gray-400 hover:text-gray-600'}`}
                    title="关闭文件夹"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Show folder files */}
              {folderFiles.map((file, idx) => {
                const existingFile = files.find(f => f.name === file.name);
                const isActive = activeFile?.name === file.name && existingFile?.id === activeFileId;
                const isRenaming = renamingFile?.path === file.path;
                return (
                  <div
                    key={`folder-${idx}`}
                    className="relative group"
                  >
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={async () => {
                          if (renameValue && renameValue !== file.name) {
                            const newPath = file.path.replace(file.name, renameValue);
                            if (window.electronAPI) {
                              const success = await window.electronAPI.renameFile(file.path, newPath);
                              if (success) {
                                setFolderFiles(prev => prev.map(f =>
                                  f.path === file.path ? { ...f, name: renameValue, path: newPath } : f
                                ));
                                setFiles(prev => prev.map(f =>
                                  f.filePath === file.path ? { ...f, name: renameValue, filePath: newPath } : f
                                ));
                              }
                            }
                          }
                          setRenamingFile(null);
                          setRenameValue('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          } else if (e.key === 'Escape') {
                            setRenamingFile(null);
                            setRenameValue('');
                          }
                        }}
                        autoFocus
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          if (existingFile) {
                            setActiveFileId(existingFile.id);
                            setCurrentTab('editor');
                          } else {
                            if (window.electronAPI) {
                              window.electronAPI.readFileFromPath?.(file.path).then((content) => {
                                if (content) {
                                  const newFile = {
                                    id: generateFileId(),
                                    name: file.name,
                                    content,
                                    isDirty: false,
                                    filePath: file.path
                                  };
                                  setFiles(prev => [...prev, newFile]);
                                  setActiveFileId(newFile.id);
                                  setCurrentTab('editor');
                                }
                              });
                            }
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, file });
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl transition-all duration-200 ${
                          isActive
                            ? (isDark ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md')
                            : (isDark ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
                        }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate flex-1">{file.name}</span>
                        {existingFile?.isDirty && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Show opened files (not from folder) */}
              {files.filter(f => !folderFiles.some(gf => gf.name === f.name)).map(file => (
                <div
                  key={file.id}
                  className="relative group"
                >
                  <button
                    onClick={() => {
                      setActiveFileId(file.id);
                      setCurrentTab('editor');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl transition-all duration-200 ${
                      activeFileId === file.id
                        ? (isDark ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md')
                        : (isDark ? 'text-gray-300 hover:bg-gray-700/50 hover:text-gray-100' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate flex-1">{file.name}</span>
                    {file.isDirty && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseFileById(file.id);
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${activeFileId === file.id ? 'hover:bg-white/20' : (isDark ? 'hover:bg-gray-600/50' : 'hover:bg-gray-200/50')}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {files.length === 0 && !folderPath && (
                <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  暂无打开的文件
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resize handle */}
        {showFileSidebar && (
          <div
            className={`w-0.5 cursor-col-resize hover:bg-emerald-500/50 transition-colors duration-200 ${isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}
            onMouseDown={startDragging}
          />
        )}

        {/* Toggle sidebar button when hidden */}
        {!showFileSidebar && (
          <button
            onClick={() => setShowFileSidebar(true)}
            className={`absolute left-3 top-3 p-2.5 rounded-xl shadow-lg backdrop-blur-md z-10 transition-all duration-300 hover:scale-110 ${isDark ? 'bg-gray-800/80 text-gray-400 hover:text-white' : 'bg-white/80 text-gray-500 hover:text-gray-700'}`}
            title="显示文件侧边栏"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* File Tabs */}
          <FileTabs
            files={files}
            activeFileId={activeFileId}
            isDark={isDark}
            onTabClick={(fileId) => {
              setActiveFileId(fileId);
              setCurrentTab('editor');
            }}
            onTabClose={handleCloseFileById}
          />

          <div className="flex-1 overflow-hidden p-2">
          {files.length === 0 ? (
            <div className="py-16">
              <div className="text-center mb-10">
                <h1 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Markdown 阅读器</h1>
                <p className="text-gray-500 text-lg">阅读、编辑、创建 Markdown 文档</p>
              </div>
              <FileUploader onFileLoaded={handleFileLoaded} theme={theme} />
            </div>
          ) : currentTab === 'editor' && activeFile ? (
            <div className={`h-full relative ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              {/* Search Replace Panel */}
              <SearchReplace
                isOpen={showSearchReplace}
                isDark={isDark}
                onClose={() => setShowSearchReplace(false)}
                onSearch={(query, isNext) => {
                  // Simple search implementation - can be enhanced with highlighting
                  if (!query) return;
                  console.log('Search:', query, isNext ? 'next' : 'prev');
                }}
                onReplace={(query, replacement) => {
                  if (!query || !activeFile) return;
                  const newContent = activeFile.content.replace(query, replacement);
                  handleContentChange(newContent);
                }}
                onReplaceAll={(query, replacement) => {
                  if (!query || !activeFile) return;
                  const newContent = activeFile.content.replaceAll(query, replacement);
                  handleContentChange(newContent);
                }}
              />
              <MarkdownEditor
                content={activeFile.content}
                fileName={activeFile.name}
                onContentChange={handleContentChange}
                onClose={handleCloseFile}
                onSave={handleSave}
                onRename={handleRenameFile}
                theme={theme}
                isMac={isMac}
                fontSize={fontSize}
              />
            </div>
          ) : currentTab === 'guide' ? (
            <div className={`h-full overflow-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <MarkdownContent content={MARKDOWN_GUIDE} theme={theme} />
            </div>
          ) : (
            <div className={`h-full overflow-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <MarkdownContent content={ABOUT_CONTENT} theme={theme} />
            </div>
          )}
          </div>
        </main>

        {/* AI Panel - Right sidebar */}
        {showAIPanel && (
          <div className={`w-80 border-l flex flex-col transition-all duration-300 ease-out ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-end p-4 border-b border-gray-200/50">
              <button
                onClick={() => {
                  setShowAIPanel(false);
                }}
                className={`p-2 rounded-full transition-all duration-200 ${isDark ? 'hover:bg-gray-700/50 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {aiMessages.length === 0 && (
                <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm">发送消息开始对话</p>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : (isDark ? 'bg-gray-700/80 text-gray-100' : 'bg-gray-100 text-gray-800')
                  }`}>
                    <div className={`font-medium text-xs mb-1 ${msg.role === 'user' ? 'text-white/70' : (isDark ? 'text-emerald-400' : 'text-emerald-600')}`}>
                      {msg.role === 'user' ? '你' : 'AI'}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-gray-700/80' : 'bg-gray-100'}`}>
                    <div className="flex gap-1">
                      <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                      <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                      <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              {pendingContent && (
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-emerald-500">待应用优化内容：</div>
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className={`px-3 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                      全屏预览
                    </button>
                  </div>
                  <div
                    className={`p-4 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} whitespace-pre-wrap max-h-60 overflow-auto`}
                    style={{ fontSize: `${aiPreviewZoom}%` }}
                  >
                    {pendingContent}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleApplyAiContent}
                      className="flex-1 py-1.5 bg-emerald-500 text-white text-sm rounded-2xl hover:bg-emerald-600 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                    >
                      应用到文件
                    </button>
                    <button
                      onClick={handleDismissAiContent}
                      className={`flex-1 py-1.5 text-sm rounded-2xl ${isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      放弃
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200/50">
              <div className="flex gap-3">
                <textarea
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAISubmit();
                    }
                  }}
                  placeholder="输入消息..."
                  className={`flex-1 px-4 py-3 text-sm rounded-2xl border resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 ${
                    isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  rows={3}
                />
              </div>
              <button
                onClick={handleAISubmit}
                disabled={aiLoading || !aiInput.trim() || !aiSettings.apiKey || !activeFile}
                className={`w-full mt-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  aiLoading || !aiInput.trim() || !aiSettings.apiKey || !activeFile
                    ? (isDark ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-100 text-gray-400')
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {aiLoading ? '处理中...' : '发送'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New File Dialog */}
      {/* New File Dialog */}
      <NewFileDialog
        isOpen={showNewFileDialog}
        fileName={newFileName}
        theme={theme}
        onFileNameChange={setNewFileName}
        onConfirm={confirmNewFile}
        onCancel={cancelNewFile}
      />

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setShowGuideModal(false)}>
          <div
            className={`w-[800px] max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden dialog-animate ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Markdown 语法指南</h2>
              <button
                onClick={() => setShowGuideModal(false)}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={`h-[60vh] overflow-auto p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <MarkdownContent content={MARKDOWN_GUIDE} theme={theme} />
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAboutModal(false)}>
          <div
            className={`w-[600px] max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>关于 Markdown Reader</h2>
              <button
                onClick={() => setShowAboutModal(false)}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={`h-[60vh] overflow-auto p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <MarkdownContent content={ABOUT_CONTENT} theme={theme} />
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        fontSize={fontSize}
        aiSettings={aiSettings}
        aiAdvancedSettings={aiAdvancedSettings}
        onThemeChange={setTheme}
        onFontSizeChange={setFontSize}
        onAiSettingsChange={setAiSettings}
        onAiAdvancedSettingsChange={setAiAdvancedSettings}
      />

      {/* Preview Modal */}
      {showPreviewModal && pendingContent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setShowPreviewModal(false)}>
          <div className={`w-[90vw] h-[90vh] rounded-2xl shadow-2xl overflow-hidden dialog-animate flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>预览优化内容</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiPreviewZoom(z => Math.max(50, z - 10))}
                    className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} w-12 text-center`}>{aiPreviewZoom}%</span>
                  <button
                    onClick={() => setAiPreviewZoom(z => Math.min(200, z + 10))}
                    className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-auto p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div style={{ fontSize: `${aiPreviewZoom}%` }}>
                <pre className={`whitespace-pre-wrap ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{pendingContent}</pre>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowPreviewModal(false)}
                className={`px-4 py-2 rounded-xl ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                关闭
              </button>
              <button
                onClick={() => {
                  handleApplyAiContent();
                  setShowPreviewModal(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg"
              >
                应用到文件
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

      {/* Right click menu for folder files */}
      {contextMenu && (
        <>
          <div
            className={`fixed z-50 py-1 rounded-lg shadow-xl border min-w-[140px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{
              left: `${Math.min(contextMenu.x, window.innerWidth - 160)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 100)}px`
            }}
          >
            <button
              onClick={() => {
                setRenameTarget(contextMenu.file);
                setRenameValue(contextMenu.file.name);
                setShowRenameDialog(true);
                setContextMenu(null);
              }}
              className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              重命名
            </button>
            <button
              onClick={() => {
                console.log('Delete clicked, file:', contextMenu.file);
                if (confirm(`确定要删除 "${contextMenu.file.name}" 吗？`)) {
                  if (window.electronAPI) {
                    window.electronAPI.deleteFile(contextMenu.file.path).then((success) => {
                      console.log('Delete success:', success);
                      if (success) {
                        setFolderFiles(prev => prev.filter(f => f.path !== contextMenu.file.path));
                        const fileToClose = files.find(f => f.filePath === contextMenu.file.path);
                        if (fileToClose) {
                          setFiles(prev => prev.filter(f => f.filePath !== contextMenu.file.path));
                          if (activeFileId === fileToClose.id) {
                            setActiveFileId(null);
                          }
                        }
                      } else {
                        alert('删除失败');
                      }
                    }).catch(err => console.error('Delete error:', err));
                  }
                }
                setContextMenu(null);
              }}
              className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500`}
            >
              删除
            </button>
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
        </>
      )}

      {/* Rename Dialog */}
      {showRenameDialog && renameTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRenameDialog(false)}>
          <div className={`rounded-xl p-6 w-80 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>重命名文件</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue && renameValue !== renameTarget.name) {
                  handleRenameSubmit();
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg mb-4 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRenameDialog(false)}
                className={`px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                取消
              </button>
              <button
                onClick={handleRenameSubmit}
                className={`px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAIModal(false)}>
          <div
            className={`w-[800px] max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden dialog-animate ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - AI Panel */}
            <div className="flex-1 flex flex-col h-[500px]">
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Chat messages */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {aiMessages.length === 0 && (
                    <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p>发送消息开始对话</p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                          : (isDark ? 'bg-gray-700/80 text-gray-100' : 'bg-gray-100 text-gray-800')
                      }`}>
                        <div className={`font-medium text-xs mb-1 ${msg.role === 'user' ? 'text-white/70' : (isDark ? 'text-emerald-400' : 'text-emerald-600')}`}>
                          {msg.role === 'user' ? '你' : 'AI'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-gray-700/80' : 'bg-gray-100'}`}>
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                          <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                          <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {pendingContent && (
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-emerald-500">待应用优化内容：</div>
                        <button
                          onClick={() => setShowPreviewModal(true)}
                          className={`px-3 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                          全屏预览
                        </button>
                      </div>
                      <div
                        className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} whitespace-pre-wrap max-h-40 overflow-auto`}
                        style={{ fontSize: `${aiPreviewZoom}%` }}
                      >
                        {pendingContent}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleApplyAiContent}
                          className="flex-1 py-2 bg-emerald-500 text-white text-sm rounded-xl hover:bg-emerald-600 hover:shadow-md transition-all duration-200"
                        >
                          应用到文件
                        </button>
                        <button
                          onClick={handleDismissAiContent}
                          className={`flex-1 py-2 text-sm rounded-xl ${isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          放弃
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <textarea
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAISubmit();
                      }
                    }}
                    placeholder="输入消息..."
                    className={`w-full px-4 py-3 text-sm rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    rows={3}
                  />
                  <button
                    onClick={handleAISubmit}
                    disabled={aiLoading || !aiInput.trim() || !aiSettings.apiKey || !activeFile}
                    className={`w-full mt-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      aiLoading || !aiInput.trim() || !aiSettings.apiKey || !activeFile
                        ? (isDark ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-100 text-gray-400')
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg active:scale-[0.98]'
                    }`}
                  >
                    {aiLoading ? '处理中...' : '发送'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirm Dialog */}
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={closeConfirmDialog.show}
        theme={theme}
        onSaveAndClose={async () => {
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
        }}
        onDiscardAndClose={() => {
          if (closeConfirmDialog.fileId) {
            setFiles(prev => prev.filter(f => f.id !== closeConfirmDialog.fileId));
            if (closeConfirmDialog.fileId === activeFileId) {
              const remaining = files.filter(f => f.id !== closeConfirmDialog.fileId);
              setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
              if (remaining.length === 0) setCurrentTab('guide');
            }
          }
          setCloseConfirmDialog({ show: false, fileId: null });
        }}
        onCancel={() => setCloseConfirmDialog({ show: false, fileId: null })}
      />
    </div>
  );
}
export default App;