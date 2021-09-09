const serverCt = require('@packages/server-ct')
const { getBrowsers } = require('../browsers/utils')
const errors = require('../errors')

const browsersForCtInteractive = ['chrome', 'chromium', 'edge', 'electron', 'firefox'] as const

const returnDefaultBrowser = (
  browsersByPriority: typeof browsersForCtInteractive,
  installedBrowsers: any[],
) => {
  const browserMap = installedBrowsers.reduce((acc, curr) => {
    acc[curr.name] = true

    return acc
  }, {})

  for (const browser of browsersByPriority) {
    if (browserMap[browser]) {
      return browser
    }
  }

  return undefined
}

export const run = async (options: Record<string, any>) => {
  const installedBrowsers = await getBrowsers()

  options.browser = options.browser || returnDefaultBrowser(browsersForCtInteractive, installedBrowsers)

  return serverCt.start(options.projectRoot, options).catch((e: Error) => {
    // Usually this kind of error management is doen inside cypress.js start
    // But here we bypassed this since we don't use the window of the gui
    // Handle errors here to avoid multiple errors appearing.
    return errors.logException(e).then(() => {
      process.exit(1)
    })
  })
}
