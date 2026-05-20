import { useState, useCallback, useEffect, lazy } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { useFileOperations } from './hooks/useFileOperations';
import { useFolderOperations } from './hooks/useFolderOperations';
import { useAIOperations } from './hooks/useAIOperations';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import { useSidebar } from './hooks/useSidebar';
import { useModals } from './hooks/useModals';
import { useAutoSave } from './hooks/useAutoSave';
import { useToast } from './hooks/useToast';
import { isMac } from './utils/helpers';

// 核心组件 - 立即加载
import { FileUploader } from './components/FileUploader';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownContent } from './components/MarkdownContent';
import { FileSidebar } from './components/FileSidebar';
import { ToastContainer } from './components/Toast';
import { SuspenseWrapper } from './components/LoadingSpinner';
import { MARKDOWN_GUIDE } from './data/markdownGuide';
import { SHORTCUTS } from './constants/shortcuts';

// 大型组件 - 懒加载
const AIPanel = lazy(() => import('./components/AIPanel').then(m => ({ default: m.AIPanel })));
const SearchReplace = lazy(() => import('./components/SearchReplace').then(m => ({ default: m.SearchReplace })));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal').then(m => ({ default: m.SettingsModal })));
const NewFileDialog = lazy(() => import('./components/modals/NewFileDialog').then(m => ({ default: m.NewFileDialog })));
const ConfirmDialog = lazy(() => import('./components/modals/ConfirmDialog').then(m => ({ default: m.ConfirmDialog })));

// Electron API 类型声明
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

function AppContent() {
  const {
    files,
    activeFileId,
    currentTab,
    setCurrentTab,
    folderPath,
    folderFiles,
    aiSettings,
    aiAdvancedSettings,
    setAiSettings,
    setAiAdvancedSettings
  } = useAppContext();

  // Custom hooks
  const { theme, setTheme, fontSize, setFontSize, toggleTheme, isDark } = useTheme();
  const { showFileSidebar, setShowFileSidebar, sidebarWidth, startDragging } = useSidebar();
  const toast = useToast();
  const {
    showNewFileDialog, setShowNewFileDialog,
    showShortcuts, setShowShortcuts,
    showGuideModal, setShowGuideModal,
    showSettingsModal, setShowSettingsModal,
    showAIPanel, setShowAIPanel,
    closeConfirmDialog, setCloseConfirmDialog
  } = useModals();

  // File operations
  const {
    createNewFile,
    openFile,
    saveFile,
    saveFileAs,
    closeFile,
    updateFileContent,
    renameFile,
    getActiveFile
  } = useFileOperations();

  // Folder operations
  const {
    openFolder,
    closeFolder,
    readFileFromPath,
    renameFolderFile,
    deleteFolderFile
  } = useFolderOperations();

  // AI operations
  const {
    aiInput,
    aiLoading,
    setAiInput,
    getCurrentMessages,
    getCurrentPendingContent,
    submitAIRequest,
    applyAIContent,
    dismissAIContent
  } = useAIOperations();

  // Local state
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [fileSearchQuery] = useState('');
  const [renamingFile, setRenamingFile] = useState<{ name: string; path: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ name: string; path: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: { name: string; path: string } } | null>(null);

  const activeFile = getActiveFile();
  const aiMessages = getCurrentMessages();
  const pendingContent = getCurrentPendingContent();

  // Auto-save
  const { isSaving: isAutoSaving } = useAutoSave({
    enabled: !!activeFile && activeFile.isDirty && !!activeFile.filePath,
    interval: 30000,
    onSave: async () => {
      if (activeFile && activeFile.filePath) {
        await saveFile(activeFile.id);
      }
    }
  });

  // Handlers
  const handleNewFile = useCallback(() => {
    setNewFileName('新文档.md');
    setShowNewFileDialog(true);
  }, []);

  const confirmNewFile = useCallback(() => {
    const name = newFileName.trim() || '未命名.md';
    createNewFile(name);
    setShowNewFileDialog(false);
    setNewFileName('');
  }, [newFileName, createNewFile]);

  const handleSave = useCallback(async () => {
    if (!activeFile || isSaving) return;
    setIsSaving(true);
    try {
      await saveFile(activeFile.id);
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, isSaving, saveFile]);

  const handleSaveAs = useCallback(async () => {
    if (!activeFile || isSaving) return;
    setIsSaving(true);
    try {
      await saveFileAs(activeFile.id);
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, isSaving, saveFileAs]);

  const handleCloseFile = useCallback(() => {
    if (!activeFileId) return;
    const result = closeFile(activeFileId);
    if (result.needsConfirmation) {
      setCloseConfirmDialog({ show: true, fileId: activeFileId });
    }
  }, [activeFileId, closeFile, setCloseConfirmDialog]);

  const handleOpenFile = useCallback(async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFile();
      if (result) {
        openFile(result.content, result.name, result.path);
      }
    }
  }, [openFile]);

  const handleFolderFileClick = useCallback(async (file: { name: string; path: string }) => {
    const existingFile = files.find(f => f.filePath === file.path);
    if (existingFile) {
      // 文件已打开，直接切换
      useAppContext().setActiveFile(existingFile.id);
      setCurrentTab('editor');
    } else {
      // 读取并打开文件
      const content = await readFileFromPath(file.path);
      if (content) {
        openFile(content, file.name, file.path);
      }
    }
  }, [files, readFileFromPath, openFile, setCurrentTab]);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameTarget || !renameValue || renameValue === renameTarget.name) {
      setShowRenameDialog(false);
      setRenameTarget(null);
      return;
    }

    const success = await renameFolderFile(renameTarget.path, renameValue);
    if (success) {
      toast.success('重命名成功');
    } else {
      toast.error('重命名失败');
    }
    setShowRenameDialog(false);
    setRenameTarget(null);
  }, [renameTarget, renameValue, renameFolderFile, toast]);

  const handleDeleteFile = useCallback(async (file: { name: string; path: string }) => {
    const shouldDelete = window.confirm(`确定要删除 "${file.name}" 吗？`);
    if (shouldDelete) {
      const success = await deleteFolderFile(file.path);
      if (success) {
        toast.success('文件已删除');
      } else {
        toast.error('删除失败');
      }
    }
  }, [deleteFolderFile, toast]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewFile: handleNewFile,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onOpenFile: handleOpenFile,
    onOpenFolder: openFolder,
    onCloseFile: handleCloseFile,
    onToggleTheme: toggleTheme,
    onShowSearch: () => setShowSearchReplace(true),
    onShowShortcuts: () => setShowShortcuts(prev => !prev)
  });

  // Electron menu callbacks
  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanups: Array<() => void> = [];

    cleanups.push(window.electronAPI.onFileOpened((data) => {
      openFile(data.content, data.name, data.path);
    }));

    cleanups.push(window.electronAPI.onMenuNewFile(handleNewFile));
    cleanups.push(window.electronAPI.onMenuSaveFile(handleSave));
    cleanups.push(window.electronAPI.onMenuSaveAsFile(handleSaveAs));
    cleanups.push(window.electronAPI.onMenuOpenFolder(openFolder));
    cleanups.push(window.electronAPI.onMenuOpenSettings(() => setShowSettingsModal(true)));

    if (window.electronAPI.onMenuOpenGuide) {
      cleanups.push(window.electronAPI.onMenuOpenGuide(() => setShowGuideModal(true)));
    }

    if (window.electronAPI.onMenuOpenShortcuts) {
      cleanups.push(window.electronAPI.onMenuOpenShortcuts(() => setShowShortcuts(true)));
    }

    return () => cleanups.forEach(cleanup => cleanup());
  }, [handleNewFile, handleSave, handleSaveAs, openFolder, openFile, setShowSettingsModal, setShowGuideModal, setShowShortcuts]);

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Auto-save indicator */}
      {isAutoSaving && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg bg-emerald-500 text-white text-sm flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          自动保存中...
        </div>
      )}

      {/* Floating AI Button */}
      {!showAIPanel && (
        <button
          onClick={() => setShowAIPanel(true)}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white shadow-2xl hover:shadow-emerald-500 hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
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

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Sidebar */}
        <FileSidebar
          isOpen={showFileSidebar}
          isDark={isDark}
          width={sidebarWidth}
          folderPath={folderPath}
          folderFiles={folderFiles.filter(f => f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()))}
          files={files}
          activeFileId={activeFileId}
          renamingFile={renamingFile}
          renameValue={renameValue}
          onClose={() => setShowFileSidebar(false)}
          onNewFile={handleNewFile}
          onFileClick={handleFolderFileClick}
          onOpenedFileClick={(id) => {
            useAppContext().setActiveFile(id);
            setCurrentTab('editor');
          }}
          onCloseFile={(id) => {
            const result = closeFile(id);
            if (result.needsConfirmation) {
              setCloseConfirmDialog({ show: true, fileId: id });
            }
          }}
          onContextMenu={(e, file) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, file });
          }}
          onRenameChange={setRenameValue}
          onRenameComplete={async (oldPath, newName) => {
            const success = await renameFolderFile(oldPath, newName);
            if (success) {
              toast.success('重命名成功');
            } else {
              toast.error('重命名失败');
            }
            setRenamingFile(null);
            setRenameValue('');
          }}
          onRenameCancel={() => {
            setRenamingFile(null);
            setRenameValue('');
          }}
          onCloseFolder={closeFolder}
        />

        {/* Resize handle */}
        {showFileSidebar && (
          <div
            className={`w-0.5 cursor-col-resize hover:bg-emerald-500 transition-colors duration-200 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            onMouseDown={startDragging}
          />
        )}

        {/* Toggle sidebar button */}
        {!showFileSidebar && (
          <button
            onClick={() => setShowFileSidebar(true)}
            className={`absolute left-3 top-3 p-2.5 rounded-xl shadow-lg z-10 transition-all duration-300 hover:scale-110 ${isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'}`}
            title="显示文件侧边栏"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        )}

        {/* Main content area */}
        <main className={`flex-1 overflow-hidden flex flex-col ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <div className="flex-1 overflow-hidden p-2">
            {files.length === 0 ? (
              <div className={`min-h-full py-16 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="text-center mb-10">
                  <h1 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Markdown 编辑器</h1>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>开始编辑你的 Markdown 文档</p>
                </div>
                <FileUploader onFileLoaded={(content: string, name: string) => openFile(content, name)} theme={theme} />
              </div>
            ) : currentTab === 'editor' && activeFile ? (
              <div className={`h-full relative ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
                <SuspenseWrapper fallback={null}>
                  <SearchReplace
                    isOpen={showSearchReplace}
                    isDark={isDark}
                    onClose={() => setShowSearchReplace(false)}
                    onSearch={() => {}}
                    onReplace={(query, replacement) => {
                      if (activeFile) {
                        const newContent = activeFile.content.replace(query, replacement);
                        updateFileContent(activeFile.id, newContent);
                      }
                    }}
                    onReplaceAll={(query, replacement) => {
                      if (activeFile) {
                        const newContent = activeFile.content.replaceAll(query, replacement);
                        updateFileContent(activeFile.id, newContent);
                      }
                    }}
                  />
                </SuspenseWrapper>
                <MarkdownEditor
                  content={activeFile.content}
                  fileName={activeFile.name}
                  onContentChange={(content) => updateFileContent(activeFile.id, content)}
                  onClose={handleCloseFile}
                  onSave={handleSave}
                  onRename={(newName) => renameFile(activeFile.id, newName)}
                  theme={theme}
                  isMac={isMac}
                  fontSize={fontSize}
                />
              </div>
            ) : currentTab === 'guide' ? (
              <div className={`h-full overflow-auto p-6 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
                <div className={`mx-auto max-w-4xl rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <MarkdownContent content={MARKDOWN_GUIDE} theme={theme} />
                </div>
              </div>
            ) : null}
          </div>
        </main>

        {/* AI Panel */}
        <SuspenseWrapper fallback={null}>
          <AIPanel
            isOpen={showAIPanel}
            isDark={isDark}
            messages={aiMessages}
            input={aiInput}
            loading={aiLoading}
            pendingContent={pendingContent}
            previewZoom={100}
            hasActiveFile={!!activeFile}
            hasApiKey={!!aiSettings.apiKey}
            onClose={() => setShowAIPanel(false)}
            onInputChange={setAiInput}
            onSubmit={submitAIRequest}
            onApplyContent={applyAIContent}
            onDismissContent={dismissAIContent}
            onShowPreview={() => {}}
          />
        </SuspenseWrapper>
      </div>

      {/* Modals */}
      <SuspenseWrapper fallback={null}>
        <NewFileDialog
          isOpen={showNewFileDialog}
          fileName={newFileName}
          theme={theme}
          onFileNameChange={setNewFileName}
          onConfirm={confirmNewFile}
          onCancel={() => {
            setShowNewFileDialog(false);
            setNewFileName('');
          }}
        />
      </SuspenseWrapper>

      {showGuideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowGuideModal(false)}>
          <div
            className={`w-[800px] max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Markdown 语法指南</h2>
              <button onClick={() => setShowGuideModal(false)} className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={`h-[60vh] overflow-auto p-6 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
              <MarkdownContent content={MARKDOWN_GUIDE} theme={theme} />
            </div>
          </div>
        </div>
      )}

      <SuspenseWrapper fallback={null}>
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
      </SuspenseWrapper>

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className={`rounded-xl p-6 w-80 max-h-[80vh] overflow-auto border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-xl`} onClick={e => e.stopPropagation()}>
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
                  <div key={i} className={`border-t my-2 ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />
                )
              ))}
            </div>
          </div>
        </div>
      )}

      <SuspenseWrapper fallback={null}>
        <ConfirmDialog
          isOpen={closeConfirmDialog.show}
          theme={theme}
          onSaveAndClose={async () => {
            if (closeConfirmDialog.fileId) {
              await saveFile(closeConfirmDialog.fileId);
              closeFile(closeConfirmDialog.fileId);
            }
            setCloseConfirmDialog({ show: false, fileId: null });
          }}
          onDiscardAndClose={() => {
            if (closeConfirmDialog.fileId) {
              // Force close without saving
              useAppContext().removeFile(closeConfirmDialog.fileId);
            }
            setCloseConfirmDialog({ show: false, fileId: null });
          }}
          onCancel={() => setCloseConfirmDialog({ show: false, fileId: null })}
        />
      </SuspenseWrapper>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className={`fixed z-50 py-1 rounded-lg shadow-xl border min-w-[140px] ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
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
              className={`w-full px-4 py-2 text-sm text-left ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              重命名
            </button>
            <button
              onClick={() => {
                handleDeleteFile(contextMenu.file);
                setContextMenu(null);
              }}
              className={`w-full px-4 py-2 text-sm text-left ${isDark ? 'text-red-300 hover:bg-red-950' : 'text-red-600 hover:bg-red-50'}`}
            >
              删除
            </button>
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
        </>
      )}

      {/* Rename Dialog */}
      {showRenameDialog && renameTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowRenameDialog(false)}>
          <div className={`rounded-xl p-6 w-80 ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-xl`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>重命名文件</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setShowRenameDialog(false);
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
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
