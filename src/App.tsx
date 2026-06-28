import { useState, useCallback, useEffect, lazy } from 'react';
import { FileProvider, useFileContext } from './contexts/FileContext';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { UISettingsProvider, useUISettingsContext } from './contexts/UISettingsContext';
import { useFileOperations } from './hooks/useFileOperations';
import { useFolderOperations } from './hooks/useFolderOperations';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';
import { useToast } from './hooks/useToast';
import { isMac } from './utils/helpers';

import { FileUploader } from './components/FileUploader';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownContent } from './components/MarkdownContent';
import { FileSidebar } from './components/FileSidebar';
import { ToastContainer } from './components/Toast';
import { SuspenseWrapper } from './components/LoadingSpinner';
import { MARKDOWN_GUIDE } from './data/markdownGuide';
import { SHORTCUTS } from './constants/shortcuts';

const SettingsModal = lazy(() => import('./components/modals/SettingsModal').then(m => ({ default: m.SettingsModal })));
const NewFileDialog = lazy(() => import('./components/modals/NewFileDialog').then(m => ({ default: m.NewFileDialog })));
const ConfirmDialog = lazy(() => import('./components/modals/ConfirmDialog').then(m => ({ default: m.ConfirmDialog })));

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
    setActiveFile,
    removeFile
  } = useFileContext();

  const { theme, fontSize, setTheme, setFontSize, toggleTheme, isDark } = useThemeContext();

  const {
    showFileSidebar, setShowFileSidebar,
    sidebarWidth, startDragging,
    showNewFileDialog, setShowNewFileDialog,
    showShortcuts, setShowShortcuts,
    showGuideModal, setShowGuideModal,
    showSettingsModal, setShowSettingsModal,
    closeConfirmDialog, setCloseConfirmDialog,
    contextMenu, setContextMenu
  } = useUISettingsContext();

  const toast = useToast();

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

  const {
    openFolder,
    closeFolder,
    readFileFromPath,
    renameFolderFile,
    deleteFolderFile
  } = useFolderOperations();

  const [newFileName, setNewFileName] = useState('');
  const [fileSearchQuery] = useState('');
  const [renamingFile, setRenamingFile] = useState<{ name: string; path: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ name: string; path: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeFile = getActiveFile();

  const { isSaving: isAutoSaving } = useAutoSave({
    enabled: !!activeFile && activeFile.isDirty && !!activeFile.filePath,
    interval: 30000,
    onSave: async () => {
      if (activeFile && activeFile.filePath) {
        await saveFile(activeFile.id);
      }
    }
  });

  const handleNewFile = useCallback(() => {
    setNewFileName('新文档.md');
    setShowNewFileDialog(true);
  }, [setShowNewFileDialog]);

  const confirmNewFile = useCallback(() => {
    const name = newFileName.trim() || '未命名.md';
    createNewFile(name);
    setShowNewFileDialog(false);
    setNewFileName('');
  }, [newFileName, createNewFile, setShowNewFileDialog]);

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
      setActiveFile(existingFile.id);
      setCurrentTab('editor');
    } else {
      const content = await readFileFromPath(file.path);
      if (content) {
        openFile(content, file.name, file.path);
      }
    }
  }, [files, readFileFromPath, openFile, setCurrentTab, setActiveFile]);

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

  useKeyboardShortcuts({
    onNewFile: handleNewFile,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onOpenFile: handleOpenFile,
    onOpenFolder: openFolder,
    onCloseFile: handleCloseFile,
    onToggleTheme: toggleTheme,
    onShowShortcuts: () => setShowShortcuts(prev => !prev)
  });

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
    <div className={`h-screen flex flex-col ${isDark ? 'bg-surface-secondary-dark text-gray-100' : 'bg-surface-secondary text-text'}`}>
      {isAutoSaving && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg bg-emerald-500 text-white text-sm flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          自动保存中...
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
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
            setActiveFile(id);
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

        {showFileSidebar && (
          <div
            className={`w-px cursor-col-resize hover:w-0.5 hover:bg-emerald-500 transition-all duration-150 ${isDark ? 'bg-border-dark' : 'bg-border'}`}
            onMouseDown={startDragging}
          />
        )}

        {!showFileSidebar && (
          <button
            onClick={() => setShowFileSidebar(true)}
            className={`fixed left-3 top-3 z-10 w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              isDark
                ? 'text-gray-500 hover:text-gray-300 hover:bg-sidebar-item-dark bg-sidebar-dark'
                : 'text-gray-400 hover:text-gray-600 hover:bg-sidebar-item bg-sidebar'
            } border ${isDark ? 'border-border-dark' : 'border-border'}`}
            title="显示文件侧边栏"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        )}

        <main className={`flex-1 overflow-hidden flex flex-col ${isDark ? 'bg-surface-dark' : 'bg-surface'}`}>
          <div className="flex-1 overflow-hidden">
            {files.length === 0 ? (
              <div className={`h-full flex flex-col items-center justify-center py-24 ${isDark ? 'bg-surface-dark' : 'bg-surface'}`}>
                <div className="text-center mb-10 max-w-sm mx-auto px-4">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${isDark ? 'bg-sidebar-item-dark' : 'bg-sidebar'}`}>
                    <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m-4 16l-4-4m8 0l-4-4" />
                    </svg>
                  </div>
                  <h1 className={`text-xl font-semibold mb-1.5 ${isDark ? 'text-gray-100' : 'text-text'}`}>Markdown 编辑器</h1>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-text-muted'}`}>开始编辑你的 Markdown 文档</p>
                </div>
                <FileUploader onFileLoaded={(content: string, name: string) => openFile(content, name)} theme={theme} />
              </div>
            ) : currentTab === 'editor' && activeFile ? (
              <div className="h-full relative">
                <MarkdownEditor
                  content={activeFile.content}
                  fileName={activeFile.name}
                  onContentChange={(content) => updateFileContent(activeFile.id, content)}
                  onClose={handleCloseFile}
                  onSave={handleSave}
                  onRename={(newName) => renameFile(activeFile.id, newName)}
                  theme={theme}
                  isMac={isMac}
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
      </div>

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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowGuideModal(false)}>
          <div
            className={`w-[720px] max-h-[80vh] overflow-hidden border animate-in-scale ${isDark ? 'bg-panel-dark border-border-dark shadow-xl' : 'bg-panel border-border shadow-xl'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-4 h-11 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
              <h2 className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-text'}`}>Markdown 语法指南</h2>
              <button onClick={() => setShowGuideModal(false)} className={`p-1 rounded-sm ${isDark ? 'hover:bg-sidebar-item-dark text-gray-500' : 'hover:bg-sidebar text-text-muted'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={`max-h-[65vh] overflow-auto p-6 ${isDark ? 'bg-panel-dark' : 'bg-panel'}`}>
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
          onThemeChange={setTheme}
          onFontSizeChange={setFontSize}
        />
      </SuspenseWrapper>

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className={`p-5 w-72 max-h-[80vh] overflow-auto border animate-in-scale ${isDark ? 'bg-panel-dark border-border-dark shadow-xl' : 'bg-panel border-border shadow-xl'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-text'}`}>快捷键</h3>
              <button onClick={() => setShowShortcuts(false)} className={`p-0.5 rounded-sm ${isDark ? 'hover:bg-sidebar-item-dark text-gray-500' : 'hover:bg-sidebar text-text-muted'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {SHORTCUTS.map((shortcut, i) => (
                shortcut.keys ? (
                  <div key={i} className="flex justify-between items-center py-0.5">
                    <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-text-muted'}`}>{shortcut.action}</span>
                    <kbd className={`px-1.5 py-0.5 text-[10px] rounded-sm ${isDark ? 'bg-sidebar-item-dark text-gray-500' : 'bg-sidebar text-text-muted'}`}>{shortcut.keys}</kbd>
                  </div>
                ) : (
                  <div key={i} className={`border-t my-1 ${isDark ? 'border-border-dark' : 'border-border'}`} />
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
              removeFile(closeConfirmDialog.fileId);
            }
            setCloseConfirmDialog({ show: false, fileId: null });
          }}
          onCancel={() => setCloseConfirmDialog({ show: false, fileId: null })}
        />
      </SuspenseWrapper>

      {contextMenu && (
        <>
          <div
            className={`fixed z-50 py-0.5 border min-w-[120px] animate-in-scale ${
              isDark
                ? 'bg-panel-dark border-border-dark shadow-lg'
                : 'bg-panel border-border shadow-lg'
            }`}
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
              className={`w-full px-3 py-1.5 text-[11px] text-left ${isDark ? 'text-gray-400 hover:bg-sidebar-item-dark' : 'text-text-muted hover:bg-sidebar'}`}
            >
              重命名
            </button>
            <button
              onClick={() => {
                handleDeleteFile(contextMenu.file);
                setContextMenu(null);
              }}
              className={`w-full px-3 py-1.5 text-[11px] text-left ${isDark ? 'text-red-400 hover:bg-sidebar-item-dark' : 'text-red-600 hover:bg-sidebar'}`}
            >
              删除
            </button>
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
        </>
      )}

      {showRenameDialog && renameTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowRenameDialog(false)}>
          <div className={`p-5 w-72 border animate-in-scale ${isDark ? 'bg-panel-dark border-border-dark shadow-xl' : 'bg-panel border-border shadow-xl'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-text'}`}>重命名</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setShowRenameDialog(false);
              }}
              className={`w-full px-2.5 py-1.5 text-xs mb-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isDark ? 'bg-sidebar-item-dark border border-border-dark text-gray-200' : 'bg-white border border-border-strong text-text'}`}
              autoFocus
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setShowRenameDialog(false)}
                className={`px-2.5 py-1.5 text-[11px] rounded-sm ${isDark ? 'text-gray-400 hover:bg-sidebar-item-dark' : 'text-text-muted hover:bg-sidebar'}`}
              >
                取消
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-2.5 py-1.5 text-[11px] rounded-sm bg-emerald-500 hover:bg-emerald-600 text-white"
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
    <ThemeProvider>
      <FileProvider>
        <UISettingsProvider>
          <AppContent />
        </UISettingsProvider>
      </FileProvider>
    </ThemeProvider>
  );
}

export default App;
