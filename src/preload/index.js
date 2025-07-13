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

  // === 修改点 1: 让 getReportMessage 也返回一个注销函数 ===
  //pdf模板接受显示的数据
  getReportMessage: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('message-from-main', listener)
    // 返回一个函数，用于移除监听
    return () => {
      ipcRenderer.removeListener('message-from-main', listener)
    }
  },

  //发送pdf模板渲染完成信息
  readyDownload: () => {
    return ipcRenderer.send('read-download')
  },

  // === 修改点 2: 让 getDownLoadSingle 返回一个注销函数 (核心修复) ===
  //接受可以开始下载pdf模板信号
  getDownLoadSingle: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('read-download', listener)
    // 返回一个函数，用于移除监听
    return () => {
      ipcRenderer.removeListener('read-download', listener)
    }
  },

  //pdf模板buffer格式返回
  downLoadReport: () => {
    return ipcRenderer.invoke('download-pdf').catch((error) => {
      console.error('Failed to send message:', error)
      throw new Error('IPC communication failed')
    })
  },

  selectFile: () => {
    return ipcRenderer.invoke('select-file') // 调用主进程中定义好的 'select-file' 处理器
  }
}

// Boilerplate code, no changes needed here
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
