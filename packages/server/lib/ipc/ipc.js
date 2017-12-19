let ipc = require('electron').ipcRenderer

process.once('loaded', function () {
  global.ipc = ipc
})
