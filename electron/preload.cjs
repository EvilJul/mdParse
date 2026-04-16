const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveDirectFile: (data) => ipcRenderer.invoke('save-direct-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readFileFromPath: (filePath) => ipcRenderer.invoke('read-file-from-path', filePath),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (event, data) => callback(data)),
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', () => callback()),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', () => callback()),
  onMenuSaveAsFile: (callback) => ipcRenderer.on('menu-save-as-file', () => callback()),
  onMenuOpenFolder: (callback) => ipcRenderer.on('menu-open-folder', () => callback())
});