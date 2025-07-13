"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const icon = path.join(__dirname, "../../resources/icon.png");
let fileWindow, mainWindow;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: false,
      nodeIntegration: true,
      // 根据需要启用Node.js集成
      enableRemoteModule: true,
      // 如果使用remote模块，请启用
      contextIsolation: false,
      // 强烈建议启用，以增强上下文隔离
      allowRunningInsecureContent: true
    }
  });
  mainWindow.setMenu(null);
  fileWindow = new electron.BrowserWindow({
    width: 800,
    height: 1200,
    show: false,
    // 不显示窗口
    frame: true,
    // 可选：移除窗口边框
    transparent: true,
    // 可选：使窗口透明，进一步减少视觉干扰
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: false,
      nodeIntegration: true,
      // 根据需要启用Node.js集成
      enableRemoteModule: true,
      // 如果使用remote模块，请启用
      contextIsolation: false,
      // 强烈建议启用，以增强上下文隔离
      allowRunningInsecureContent: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    fileWindow.loadURL(process.env["ELECTRON_RENDERER_URL"] + "/fileRender/index.html");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    fileWindow.loadFile(path.join(__dirname, "../renderer/fileRender/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.handle("capture-window", async (event) => {
  const win = electron.BrowserWindow.fromWebContents(event.sender);
  const image = await win.webContents.capturePage();
  return image.toPNG();
});
electron.ipcMain.on("copy-to-clipboard", async (event) => {
  const win = electron.BrowserWindow.fromWebContents(event.sender);
  const image = await win.webContents.capturePage();
  let img = image.toPNG();
  electron.clipboard.writeImage(electron.nativeImage.createFromBuffer(img));
});
electron.ipcMain.on("report-message", async (event, info) => {
  if (fileWindow && !fileWindow.isDestroyed()) {
    fileWindow.webContents.send("message-from-main", info);
  }
});
electron.ipcMain.on("read-download", async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("read-download");
  }
});
electron.ipcMain.handle("download-pdf", async (event, info) => {
  return await fileWindow.webContents.printToPDF({
    printBackground: true,
    pageSize: {
      width: 8.5,
      height: 12
    },
    landscape: false
  });
});
electron.ipcMain.handle("select-file", async () => {
  const { canceled, filePaths } = await electron.dialog.showOpenDialog({
    properties: ["openFile"],
    // 你可以根据需要添加文件类型过滤器
    filters: [
      { name: "Data Files", extensions: ["mdb", "xlsx", "brd", "xyz"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  if (!canceled && filePaths.length > 0) {
    return filePaths[0];
  }
  return null;
});
