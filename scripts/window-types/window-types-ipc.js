let { ipcRenderer } = require('electron')

process.once('loaded', () => {
  global.ipcRenderer = ipcRenderer
})
