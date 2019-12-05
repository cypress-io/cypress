const debug = require('debug')('cypress:server:electron_app')

const scale = () => {
  try {
    const { app } = require('electron')

    return app.commandLine.appendSwitch('force-device-scale-factor', '1')
  } catch (err) {
    return
  }
}

/**
 * Parses a single Electron launch argument. If argument has value "true" it is converted
 * into a boolean.
 *
 * @param {string} token Token to parse, like "disable-renderer-backgrounding=true"
 */
const parseLaunchArgument = (token) => {
  if (token.includes('=')) {
    let [key, value] = token.split('=')

    if (value === 'true') {
      value = true
    }

    return [key, value]
  }

  return [token, undefined]
}
/**
 * Users can specify additional Electron launch flags via an environment variable.
 * This function parses that variable's string into an object.
 * @param {string} s Input string with values likes "foo bar=baz disable-renderer-backgrounding=true"
*/
const parseElectronLaunchArguments = (s) => {
  const tokens = s.split(' ')
  const result = {}

  tokens.forEach((token) => {
    const [key, value] = parseLaunchArgument(token)

    result[key] = value
  })

  return result
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

  parseElectronLaunchArguments,
}
