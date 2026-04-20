const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false
  });

  // Get the app path - works both in development and packaged app
const appPath = app.getAppPath();
console.log('App path:', appPath);
console.log('Node env:', process.env.NODE_ENV);

// Load the app - only use dev server when explicitly in development mode
// Also check if we're in the project directory (not packaged) to determine dev mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
console.log('Is dev:', isDev);

if (isDev) {
    // Try multiple times with different ports in case 5175 is busy
    const tryLoadDevServer = (port, attempts) => {
        if (attempts <= 0) {
            console.log('Could not connect to dev server, trying fallback to file');
            // Fallback to file if dev server fails
            const indexPath = path.join(__dirname, '../dist/index.html');
            mainWindow.loadFile(indexPath).catch(e => console.log('File fallback failed:', e));
            return;
        }

        mainWindow.loadURL(`http://localhost:${port}`)
            .then(() => {
                console.log(`Loaded dev server at port ${port}`);
            })
            .catch(err => {
                console.log(`Failed to load port ${port}, trying next...`);
                // Try different ports
                const nextPort = port === 5173 ? 5174 : (port === 5174 ? 5175 : 5173);
                tryLoadDevServer(nextPort, attempts - 1);
            });
    };

    // Give dev server time to start
    setTimeout(() => {
        tryLoadDevServer(5173, 4);
        mainWindow.webContents.openDevTools();
    }, 2000);
} else {
    // In production, load from the app's dist folder
    const indexPath = path.join(appPath, 'dist/index.html');
    console.log('Loading from:', indexPath);
    mainWindow.loadFile(indexPath);
}

  // Open devtools to debug
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['verbose', 'info', 'warning', 'error'];
    console.log('Renderer', levels[level] || 'log', ':', message);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.log('Render process gone:', details.reason);
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.log('Window unresponsive');
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: '文件',
      submenu: [
        {
          label: '新建文件',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-file')
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'Markdown', extensions: ['md'] }],
              properties: ['openFile']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const content = fs.readFileSync(result.filePaths[0], 'utf-8');
              const name = path.basename(result.filePaths[0]);
              mainWindow.webContents.send('file-opened', { content, name, path: result.filePaths[0] });
            }
          }
        },
        {
          label: '保存文件',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-file')
        },
        {
          label: '另存为...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu-save-as-file')
        },
        {
          label: '打开文件夹...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow.webContents.send('menu-open-folder')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [
          { role: 'close' }
        ])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handle save as dialog
ipcMain.handle('save-file', async (event, { content, defaultName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

// Handle save directly (overwrite)
ipcMain.handle('save-direct-file', async (event, { content, filePath }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Failed to save file:', error);
    return { success: false };
  }
});

// Handle open folder
ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.md') && !file.startsWith('._'))
      .map(file => ({
        name: file,
        path: path.join(folderPath, file),
        content: fs.readFileSync(path.join(folderPath, file), 'utf-8')
      }));
    return { success: true, folderPath, files };
  }
  return { success: false };
});

// Handle read file from path
ipcMain.handle('read-file-from-path', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Failed to read file:', error);
    return null;
  }
});

// Handle rename file
ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
  try {
    fs.renameSync(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Failed to rename file:', error);
    return false;
  }
});

// Handle delete file
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
});

// Handle open dialog
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    return { content, name, path: filePath };
  }
  return null;
});

// Handle file opened via command line / file association
function handleFileOpen(filePath) {
  if (filePath && filePath.endsWith('.md')) {
    console.log('Opening file from command line:', filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    if (mainWindow) {
      mainWindow.webContents.send('file-opened', { content, name, path: filePath });
    }
  }
}

// Windows: handle file association via command line arguments
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // Handle file opened via second instance
    const filePath = commandLine.find(arg => arg.endsWith('.md'));
    if (filePath) {
      handleFileOpen(filePath);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // Check command line arguments on startup (Windows file association)
  if (process.platform === 'win32') {
    const filePath = process.argv.find(arg => arg.endsWith('.md'));
    if (filePath) {
      setTimeout(() => handleFileOpen(filePath), 500);
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});