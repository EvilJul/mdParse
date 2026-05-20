import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { generateFileId } from '../utils/helpers';

export function useFolderOperations() {
  const {
    folderPath,
    folderFiles,
    setFolderPath,
    setFolderFiles,
    addFile,
    updateFile,
    removeFile,
    files,
    setActiveFile,
    setCurrentTab
  } = useAppContext();

  // 打开文件夹
  const openFolder = useCallback(async () => {
    if (!window.electronAPI) return;

    const result = await window.electronAPI.openFolder();
    if (result && result.success && result.files && result.folderPath) {
      const newFiles = result.files.map((file: { name: string; path: string; content: string }) => ({
        id: generateFileId(),
        name: file.name,
        content: file.content,
        isDirty: false,
        filePath: file.path
      }));

      // 添加所有文件
      newFiles.forEach(file => addFile(file));

      setFolderPath(result.folderPath);
      setFolderFiles(result.files.map((f: { name: string; path: string }) => ({
        name: f.name,
        path: f.path
      })));

      if (newFiles.length > 0) {
        setActiveFile(newFiles[0].id);
        setCurrentTab('editor');
      }
    }
  }, [addFile, setFolderPath, setFolderFiles, setActiveFile, setCurrentTab]);

  // 关闭文件夹
  const closeFolder = useCallback(() => {
    const folderFilePaths = folderFiles.map(f => f.path);
    const filesToRemove = files.filter(f => f.filePath && folderFilePaths.includes(f.filePath));

    filesToRemove.forEach(file => removeFile(file.id));

    setFolderPath(null);
    setFolderFiles([]);
  }, [folderFiles, files, removeFile, setFolderPath, setFolderFiles]);

  // 从路径读取文件
  const readFileFromPath = useCallback(async (filePath: string) => {
    if (!window.electronAPI) return null;
    return await window.electronAPI.readFileFromPath(filePath);
  }, []);

  // 重命名文件夹中的文件
  const renameFolderFile = useCallback(async (oldPath: string, newName: string) => {
    if (!window.electronAPI) return false;

    const newPath = oldPath.replace(/[^/\\]+$/, newName);
    const success = await window.electronAPI.renameFile(oldPath, newPath);

    if (success) {
      // 更新 folderFiles
      setFolderFiles((prev) => prev.map((f) =>
        f.path === oldPath ? { ...f, name: newName, path: newPath } : f
      ));

      // 更新已打开的文件
      const openedFile = files.find(f => f.filePath === oldPath);
      if (openedFile) {
        updateFile(openedFile.id, { name: newName, filePath: newPath });
      }
    }

    return success;
  }, [files, updateFile, setFolderFiles]);

  // 删除文件夹中的文件
  const deleteFolderFile = useCallback(async (filePath: string) => {
    if (!window.electronAPI) return false;

    const success = await window.electronAPI.deleteFile(filePath);

    if (success) {
      // 从 folderFiles 中移除
      setFolderFiles((prev) => prev.filter((f) => f.path !== filePath));

      // 关闭已打开的文件
      const openedFile = files.find(f => f.filePath === filePath);
      if (openedFile) {
        removeFile(openedFile.id);
      }
    }

    return success;
  }, [files, removeFile, setFolderFiles]);

  return {
    folderPath,
    folderFiles,
    openFolder,
    closeFolder,
    readFileFromPath,
    renameFolderFile,
    deleteFolderFile
  };
}
