import _ from 'lodash'
import { knownBrowsers } from '../../lib/known-browsers'
import { expect } from 'chai'
const snapshot = require('snap-shot-it')

describe('browsers', () => {
  it('returns the expected list of browsers', () => {
    snapshot(knownBrowsers)
  })

  // https://github.com/cypress-io/cypress/issues/6669
  it('exports multiline versionRegexes', () => {
    expect(_.every(knownBrowsers.map(({ versionRegex }) => {
      return versionRegex.multiline
    }))).to.be.true
  })

  describe('browser.validator', () => {
    const firefoxBrowser = {
      ...knownBrowsers.find(({ name, channel }) => name === 'firefox' && channel === 'stable'),
      path: '/path/to/firefox',
    }

    context('validator defined', () => {
      it('when conditions met: marks browser as not supported and generates warning message', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '101.1.0',
          majorVersion: '101',
          validator: (browser, platform) => {
            if (platform === 'win32' && browser.majorVersion && ['101', '102'].includes(browser.majorVersion)) {
              return {
                isSupported: false,
                warningMessage: `Cypress does not support running ${browser.displayName} version ${browser.majorVersion} on Windows due to a blocking bug in ${browser.displayName}. To use ${browser.displayName} with Cypress on Windows, install version 103 or newer.`,
              }
            }

            return {
              isSupported: true,
            }
          },
        }

        const result = foundBrowser.validator(foundBrowser, 'win32')

        expect(result.isSupported).to.be.false
        expect(result.warningMessage).to.contain('Cypress does not support running Firefox version 101 on Windows due to a blocking bug in Firefox.')
      })

      it('when conditions not met: marks browser as not supported and generates warning message', () => {
        const foundBrowser = {
          ...firefoxBrowser,
          version: '101.1.0',
          majorVersion: '140',
          validator: (browser, platform) => {
            if (platform === 'win32' && browser.majorVersion && ['101', '102'].includes(browser.majorVersion)) {
              return {
                isSupported: false,
                warningMessage: `Cypress does not support running ${browser.displayName} version ${browser.majorVersion} on Windows due to a blocking bug in ${browser.displayName}. To use ${browser.displayName} with Cypress on Windows, install version 103 or newer.`,
              }
            }

            return {
              isSupported: true,
            }
          },
        }

        const result = foundBrowser.validator(foundBrowser, 'win32')

        expect(result.isSupported).to.be.true
        expect(result.warningMessage).to.be.undefined
      })
    })
  })
})
