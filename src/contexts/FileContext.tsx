import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { FileState, TabType } from '../types';
import { useDebouncedLocalStorage } from '../hooks/useDebounce';

interface FileContextType {
  files: FileState[];
  activeFileId: string | null;
  currentTab: TabType;

  folderPath: string | null;
  folderFiles: Array<{ name: string; path: string }>;

  addFile: (file: FileState) => void;
  updateFile: (id: string, updates: Partial<FileState>) => void;
  removeFile: (id: string) => void;
  setActiveFile: (id: string | null) => void;
  setCurrentTab: (tab: TabType) => void;

  setFolderPath: (path: string | null) => void;
  setFolderFiles: (files: Array<{ name: string; path: string }> | ((prev: Array<{ name: string; path: string }>) => Array<{ name: string; path: string }>)) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileState[]>(() => {
    const saved = localStorage.getItem('mdparse-files');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    const saved = localStorage.getItem('mdparse-active-file-id');
    if (!saved) return null;
    const filesSaved = localStorage.getItem('mdparse-files');
    if (!filesSaved) return null;
    const files = JSON.parse(filesSaved);
    if (files.some((f: any) => f.id === saved)) return saved;
    return files.length > 0 ? files[0].id : null;
  });
  const [currentTab, setCurrentTab] = useState<TabType>('editor');

  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<Array<{ name: string; path: string }>>([]);

  useDebouncedLocalStorage('mdparse-files', files, 1000);
  useDebouncedLocalStorage('mdparse-active-file-id', activeFileId, 500);

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

  return (
    <FileContext.Provider value={{
      files,
      activeFileId,
      currentTab,
      folderPath,
      folderFiles,
      addFile,
      updateFile,
      removeFile,
      setActiveFile,
      setCurrentTab,
      setFolderPath,
      setFolderFiles,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFileContext() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within FileProvider');
  }
  return context;
}
