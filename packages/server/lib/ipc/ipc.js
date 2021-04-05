const {
  contextBridge,
  ipcRenderer,
} = require('electron')

contextBridge.exposeInMainWorld('ipc', {
  on: (...args) => ipcRenderer.on(...args),
  send: (...args) => ipcRenderer.send(...args),
})
