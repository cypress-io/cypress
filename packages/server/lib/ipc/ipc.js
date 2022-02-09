const debug = require('debug')('cypress:server:ipc')

if (require('../util/electron-app').isRunningAsElectronProcess({ debug })) {
  const {
    contextBridge,
    ipcRenderer,
  } = require('electron')

  contextBridge.exposeInMainWorld('ipc', {
    on: (...args) => ipcRenderer.on(...args),
    send: (...args) => ipcRenderer.send(...args),
  })
}
