const serverCt = require('@packages/server-ct')
const { getBrowsers } = require('../browsers/utils')
const errors = require('../errors')

const browsersForCtInteractive = ['chrome', 'chromium', 'edge', 'electron', 'firefox']

const returnDefaultBrowser = (browsersByPriority, installedBrowsers) => {
  const browserMap = installedBrowsers.reduce((acc, curr) => {
    acc[curr.name] = true

    return acc
  }, {})

  for (const browser of browsersByPriority) {
    if (browserMap[browser]) {
      return browser
    }
  }
}

const run = async (options) => {
  const installedBrowsers = await getBrowsers()

  options.browser = options.browser || returnDefaultBrowser(browsersForCtInteractive, installedBrowsers)

  return serverCt.start(options.projectRoot, options).catch((e) => {
    // Usually this kind of error management is doen inside cypress.js start
    // But here we bypassed this since we don't use the window of the gui
    // Handle errors here to avoid multiple errors appearing.
    return errors.logException(e).then(() => {
      process.exit(1)
    })
  })
}

module.exports = {
  run,
  returnDefaultBrowser,
  browsersForCtInteractive,
}
