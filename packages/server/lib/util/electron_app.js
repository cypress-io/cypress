const scale = () => {
  try {
    const { app } = require('electron')

    return app.commandLine.appendSwitch('force-device-scale-factor', '1')
  } catch (err) {
    return
  }
}

const ready = () => {
  const Promise = require('bluebird')
  const { app } = require('electron')

  const waitForReady = () => {
    return new Promise((resolve) => {
      app.on('ready', resolve)
    })
  }

  return Promise.any([
    waitForReady(),
    Promise.delay(500),
  ])
}

module.exports = {
  scale,

  ready,
}
