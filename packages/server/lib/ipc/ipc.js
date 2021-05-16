const debug = require('debug')('cypress:server:ipc')

try {
  const {
    contextBridge,
    ipcRenderer,
  } = require('electron')

  contextBridge.exposeInMainWorld('ipc', {
    on: (...args) => ipcRenderer.on(...args),
    send: (...args) => ipcRenderer.send(...args),
  })
} catch {
  debug('running as a node process, not an electron process')
}
