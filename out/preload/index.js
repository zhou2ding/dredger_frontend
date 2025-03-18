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
  //pdf模板接受显示的数据
  getReportMessage: (callback) => {
    electron.ipcRenderer.on("message-from-main", (event, data) => {
      callback(data);
    });
  },
  //发送pdf模板渲染完成信息
  readyDownload: () => {
    return electron.ipcRenderer.send("read-download");
  },
  //接受可以开始下载pdf模板信号
  getDownLoadSingle: (callback) => {
    electron.ipcRenderer.on("read-download", (event, data) => {
      callback(data);
    });
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
