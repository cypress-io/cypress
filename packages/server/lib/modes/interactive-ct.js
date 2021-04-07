const serverCt = require('@packages/server-ct')
const { getBrowsers } = require('../browsers/utils')

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

  return serverCt.start(options.projectRoot, options)
}

module.exports = {
  run,
  returnDefaultBrowser,
  browsersForCtInteractive,
}
