const scale = () => {
  try {
    const { app } = require('electron')

    return app.commandLine.appendSwitch('force-device-scale-factor', '1')
  } catch (err) {
    return
  }
}

const isRunning = () => {
  // are we in the electron or the node process?
  return Boolean(process.env.ELECTRON_RUN_AS_NODE || process.versions && process.versions.electron)
}

const isRunningAsElectronProcess = ({ debug } = {}) => {
  const isElectronProcess = !process.env.ELECTRON_RUN_AS_NODE

  if (!isElectronProcess && debug) {
    debug('running as a node process without xvfp due to ELECTRON_RUN_AS_NODE env var')
  }

  return isElectronProcess
}

module.exports = {
  scale,

  isRunning,

  isRunningAsElectronProcess,
}
