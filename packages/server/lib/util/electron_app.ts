import Promise from 'bluebird'

export const scale = () => {
  try {
    const { app } = require('electron')

    return app.commandLine.appendSwitch('force-device-scale-factor', '1')
  } catch (err) {
    return
  }
}

export const ready = () => {
  const { app } = require('electron')

  const waitForReady = () => {
    return new Promise((resolve) => {
      app.on('ready', resolve)
    })
  }

  return Promise.any([waitForReady(), Promise.delay(500)])
}
