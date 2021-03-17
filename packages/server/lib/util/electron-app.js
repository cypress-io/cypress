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
  return Boolean(process.versions && process.versions.electron)
}

module.exports = {
  scale,

  isRunning,
}
