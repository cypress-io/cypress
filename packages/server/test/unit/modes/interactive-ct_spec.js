require('../../spec_helper')

const { browsers } = require('@packages/launcher/lib/browsers')
const {
  returnDefaultBrowser,
  browsersForCtInteractive,
} = require(`${root}../lib/modes/interactive-ct`)

function filterBrowsers (list) {
  return browsers.filter((browser) => list.includes(browser.name))
}

describe('returnDefaultBrowser', () => {
  it('returns chrome by default is available', async () => {
    const installedBrowsers = filterBrowsers(['electron', 'chromium', 'chrome'])
    const actual = await returnDefaultBrowser(browsersForCtInteractive, installedBrowsers)

    expect(actual).to.eq('chrome')
  })

  it('returns chromium if chrome is not installed', async () => {
    const installedBrowsers = filterBrowsers(['electron', 'edge', 'chromium'])
    const actual = await returnDefaultBrowser(browsersForCtInteractive, installedBrowsers)

    expect(actual).to.eq('chromium')
  })

  it('returns undefined if no browser found', async () => {
    // error message is handlded further down.
    const installedBrowsers = filterBrowsers([])
    const actual = await returnDefaultBrowser(browsersForCtInteractive, installedBrowsers)

    expect(actual).to.eq(undefined)
  })
})
