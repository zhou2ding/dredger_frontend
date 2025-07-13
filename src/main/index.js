import { app, BrowserWindow, clipboard, dialog, ipcMain, nativeImage, shell } from 'electron' // <--- 修改点1：在这里添加 dialog
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let fileWindow, mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      nodeIntegration: true, // 根据需要启用Node.js集成
      enableRemoteModule: true, // 如果使用remote模块，请启用
      contextIsolation: false, // 强烈建议启用，以增强上下文隔离
      allowRunningInsecureContent: true
    }
  })
  // 移除默认菜单
  mainWindow.setMenu(null)
  fileWindow = new BrowserWindow({
    width: 800,
    height: 1200,
    show: false, // 不显示窗口
    frame: true, // 可选：移除窗口边框
    transparent: true, // 可选：使窗口透明，进一步减少视觉干扰
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      nodeIntegration: true, // 根据需要启用Node.js集成
      enableRemoteModule: true, // 如果使用remote模块，请启用
      contextIsolation: false, // 强烈建议启用，以增强上下文隔离
      allowRunningInsecureContent: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    fileWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/fileRender/index.html')
    mainWindow.webContents.openDevTools()
    // fileWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    fileWindow.loadFile(join(__dirname, '../renderer/fileRender/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//快照截图
ipcMain.handle('capture-window', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const image = await win.webContents.capturePage()
  return image.toPNG()
})
//快照截图保存到截切版
ipcMain.on('copy-to-clipboard', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const image = await win.webContents.capturePage()
  let img = image.toPNG()
  clipboard.writeImage(nativeImage.createFromBuffer(img))
})
//报表信息
ipcMain.on('report-message', async (event, info) => {
  if (fileWindow && !fileWindow.isDestroyed()) {
    fileWindow.webContents.send('message-from-main', info)
  }
})
//报表信息
ipcMain.on('read-download', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('read-download')
  }
})
//下载pdf报表信息
ipcMain.handle('download-pdf', async (event, info) => {
  return await fileWindow.webContents.printToPDF({
    printBackground: true,
    pageSize: {
      width: 8.5,
      height: 12
    },
    landscape: false
  })
})

// === 修改点2：在这里添加用于选择文件的IPC处理器 ===
ipcMain.handle('select-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    // 你可以根据需要添加文件类型过滤器
    filters: [
      { name: 'Data Files', extensions: ['mdb', 'xlsx', 'brd', 'xyz'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (!canceled && filePaths.length > 0) {
    return filePaths[0] // 返回选择的文件路径
  }
  return null // 如果用户取消选择，则返回 null
})
