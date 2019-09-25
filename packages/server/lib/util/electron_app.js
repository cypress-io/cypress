const debug = require('debug')('cypress:server:electron_app')

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

  // electron >= 5.0.0 will exit the app if all browserwindows are closed,
  // this is obviously undesirable in run mode
  // https://github.com/cypress-io/cypress/pull/4720#issuecomment-514316695
  app.on('window-all-closed', () => {
    debug('all BrowserWindows closed, not exiting')
  })

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
