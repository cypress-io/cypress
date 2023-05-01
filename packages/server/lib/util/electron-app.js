const getPort = require('get-port')

const scale = () => {
  try {
    const { app } = require('electron')

    return app.commandLine.appendSwitch('force-device-scale-factor', '1')
  } catch (err) {
    // Catch errors for when we're running outside of electron in development
    return
  }
}

const getRemoteDebuggingPort = () => {
  try {
    const { app } = require('electron')

    return app.commandLine.getSwitchValue('remote-debugging-port')
  } catch (err) {
    // Catch errors for when we're running outside of electron in development
    return
  }
}

const setRemoteDebuggingPort = async () => {
  try {
    const port = await getPort()
    const { app } = require('electron')

    // set up remote debugging port
    app.commandLine.appendSwitch('remote-debugging-port', String(port))
  } catch (err) {
    // Catch errors for when we're running outside of electron in development
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

  getRemoteDebuggingPort,

  setRemoteDebuggingPort,

  isRunning,

  isRunningAsElectronProcess,
}
