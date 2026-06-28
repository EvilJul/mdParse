import { useCallback } from 'react';
import { useFileContext } from '../contexts/FileContext';
import { generateFileId } from '../utils/helpers';
import type { FileState } from '../types';

export function useFileOperations() {
  const { addFile, updateFile, removeFile, files, activeFileId, setCurrentTab } = useFileContext();

  // 创建新文件
  const createNewFile = useCallback((name: string) => {
    const finalName = name.endsWith('.md') ? name : `${name}.md`;
    const newFile: FileState = {
      id: generateFileId(),
      name: finalName,
      content: `# ${finalName.replace('.md', '')}\n\n开始编写你的内容...\n`,
      isDirty: false
    };
    addFile(newFile);
    setCurrentTab('editor');
  }, [addFile, setCurrentTab]);

  // 打开文件
  const openFile = useCallback((content: string, name: string, filePath?: string) => {
    const newFile: FileState = {
      id: generateFileId(),
      name,
      content,
      isDirty: false,
      filePath
    };
    addFile(newFile);
    setCurrentTab('editor');
  }, [addFile, setCurrentTab]);

  // 另存为
  const saveFileAs = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return { success: false };

    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile({
        content: file.content,
        defaultName: file.name
      });

      if (result.success && result.path) {
        const fileName = result.path.split(/[\\/]/).pop() || file.name;
        updateFile(fileId, { isDirty: false, filePath: result.path, name: fileName });
        return { success: true, path: result.path };
      }
      return { success: false };
    }

    // 浏览器环境回退
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    updateFile(fileId, { isDirty: false });
    return { success: true };
  }, [files, updateFile]);

  // 保存文件
  const saveFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return { success: false };

    if (file.filePath && window.electronAPI) {
      const result = await window.electronAPI.saveDirectFile({
        content: file.content,
        filePath: file.filePath
      });
      if (result.success) {
        updateFile(fileId, { isDirty: false });
        return { success: true };
      }
    }

    return await saveFileAs(fileId);
  }, [files, updateFile, saveFileAs]);

  // 关闭文件
  const closeFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file?.isDirty) {
      return { needsConfirmation: true };
    }
    removeFile(fileId);
    return { needsConfirmation: false };
  }, [files, removeFile]);

  // 更新文件内容
  const updateFileContent = useCallback((fileId: string, content: string) => {
    updateFile(fileId, { content, isDirty: true });
  }, [updateFile]);

  // 重命名文件
  const renameFile = useCallback((fileId: string, newName: string) => {
    const finalName = newName.endsWith('.md') ? newName : `${newName}.md`;
    updateFile(fileId, { name: finalName });
  }, [updateFile]);

  // 获取当前活动文件
  const getActiveFile = useCallback(() => {
    return files.find(f => f.id === activeFileId) || null;
  }, [files, activeFileId]);

  return {
    createNewFile,
    openFile,
    saveFile,
    saveFileAs,
    closeFile,
    updateFileContent,
    renameFile,
    getActiveFile
  };
}
