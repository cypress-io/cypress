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
    const { app } = require('electron')

    // if port was already set via passing from environment variable ELECTRON_EXTRA_LAUNCH_ARGS,
    // then just keep the supplied value
    if (app.commandLine.getSwitchValue('remote-debugging-port')) {
      return
    }

    const port = await getPort()

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
