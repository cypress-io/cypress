import { describe, it, expect } from 'vitest'
import _ from 'lodash'
import { knownBrowsers } from '../../lib/known-browsers'

describe('browsers', () => {
  it('returns the expected list of browsers', () => {
    expect(knownBrowsers).toMatchSnapshot()
  })

  // https://github.com/cypress-io/cypress/issues/6669
  it('exports multiline versionRegexes', () => {
    expect(_.every(knownBrowsers.map(({ versionRegex }) => {
      return versionRegex.multiline
    }))).toBe(true)
  })

  describe('browser.validator', () => {
    const FIREFOX_KNOWN_BROWSER_CHANNELS = knownBrowsers.filter((browser) => {
      return browser.family === 'firefox'
    })

    FIREFOX_KNOWN_BROWSER_CHANNELS.forEach((browser) => {
      it(`${browser.channel}: fails validation when Firefox major version is below 140`, () => {
        // @ts-expect-error
        const result = browser.validator({
          majorVersion: '139',
          displayName: 'Firefox',
        })

        expect(result.isSupported).toBe(false)
        expect(result.warningMessage).toEqual('Cypress does not support running Firefox version 139 due to an incomplete WebDriver BiDi implementation. To use Firefox with Cypress, install version 140 or newer.')
      })
    })
  })
})
