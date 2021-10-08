const debug = require('debug')('cypress:e2e')

module.exports = function (onFn, config) {
  debug('plugin file %s', __filename)
  debug('received config with browsers %o', config.browsers)

  if (!Array.isArray(config.browsers)) {
    throw new Error('Expected list of browsers in the config')
  }

  if (config.browsers.length === 0) {
    throw new Error('Expected at least 1 browser in the config')
  }

  const electronBrowser = config.browsers.find((browser) => {
    return browser.name === 'electron'
  })

  if (!electronBrowser) {
    throw new Error('List of browsers passed into plugins does not include Electron browser')
  }

  const changedConfig = {
    browsers: [electronBrowser],
  }

  debug('returning only Electron browser from plugins %o', changedConfig)

  return changedConfig
}
