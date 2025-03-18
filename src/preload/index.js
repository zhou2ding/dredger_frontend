import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  //截图保存
  captureWindow: (message) => {
    return ipcRenderer.invoke('capture-window', message).catch((error) => {
      console.error('Failed to send message:', error)
      throw new Error('IPC communication failed')
    })
  },
  //截图保存到截切版
  copyToClipboard: () => {
    return ipcRenderer.send('copy-to-clipboard')
  },
  // 发送数据到pdf模板
  postReportMessage: (info) => {
    return ipcRenderer.send('report-message', info)
  },
  //pdf模板接受显示的数据
  getReportMessage: (callback) => {
    ipcRenderer.on('message-from-main', (event, data) => {
      callback(data)
    })
  },
  //发送pdf模板渲染完成信息
  readyDownload: () => {
    return ipcRenderer.send('read-download')
  },
  //接受可以开始下载pdf模板信号
  getDownLoadSingle: (callback) => {
    ipcRenderer.on('read-download', (event, data) => {
      callback(data)
    })
  },
  //pdf模板buffer格式返回
  downLoadReport: () => {
    return ipcRenderer.invoke('download-pdf').catch((error) => {
      console.error('Failed to send message:', error)
      throw new Error('IPC communication failed')
    })
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
