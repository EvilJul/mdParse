const { contextBridge, ipcRenderer } = require('electron');

// Create a map to store listener removal functions
const listenerCache = new Map();

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveDirectFile: (data) => ipcRenderer.invoke('save-direct-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readFileFromPath: (filePath) => ipcRenderer.invoke('read-file-from-path', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  onFileOpened: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('file-opened', handler);
    return () => ipcRenderer.removeListener('file-opened', handler);
  },
  onMenuNewFile: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu-new-file', handler);
    return () => ipcRenderer.removeListener('menu-new-file', handler);
  },
  onMenuSaveFile: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu-save-file', handler);
    return () => ipcRenderer.removeListener('menu-save-file', handler);
  },
  onMenuSaveAsFile: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu-save-as-file', handler);
    return () => ipcRenderer.removeListener('menu-save-as-file', handler);
  },
  onMenuOpenFolder: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu-open-folder', handler);
    return () => ipcRenderer.removeListener('menu-open-folder', handler);
  }
});