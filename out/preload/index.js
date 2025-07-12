"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  //截图保存
  captureWindow: (message) => {
    return electron.ipcRenderer.invoke("capture-window", message).catch((error) => {
      console.error("Failed to send message:", error);
      throw new Error("IPC communication failed");
    });
  },
  //截图保存到截切版
  copyToClipboard: () => {
    return electron.ipcRenderer.send("copy-to-clipboard");
  },
  // 发送数据到pdf模板
  postReportMessage: (info) => {
    return electron.ipcRenderer.send("report-message", info);
  },
  // === 修改点 1: 让 getReportMessage 也返回一个注销函数 ===
  //pdf模板接受显示的数据
  getReportMessage: (callback) => {
    const listener = (event, data) => callback(data);
    electron.ipcRenderer.on("message-from-main", listener);
    return () => {
      electron.ipcRenderer.removeListener("message-from-main", listener);
    };
  },
  //发送pdf模板渲染完成信息
  readyDownload: () => {
    return electron.ipcRenderer.send("read-download");
  },
  // === 修改点 2: 让 getDownLoadSingle 返回一个注销函数 (核心修复) ===
  //接受可以开始下载pdf模板信号
  getDownLoadSingle: (callback) => {
    const listener = (event, data) => callback(data);
    electron.ipcRenderer.on("read-download", listener);
    return () => {
      electron.ipcRenderer.removeListener("read-download", listener);
    };
  },
  //pdf模板buffer格式返回
  downLoadReport: () => {
    return electron.ipcRenderer.invoke("download-pdf").catch((error) => {
      console.error("Failed to send message:", error);
      throw new Error("IPC communication failed");
    });
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
