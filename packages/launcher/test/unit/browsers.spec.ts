import { describe, it, expect } from 'vitest'
import { knownBrowsers } from '../../lib/known-browsers'
import { getVersionNumber } from '../../lib/linux'

const knownBrowser = (displayName: string) => {
  const browser = knownBrowsers.find((b) => b.displayName === displayName)

  if (!browser) {
    throw new Error(`no known browser named ${displayName}`)
  }

  return browser
}

// `--version` output of each channel, and the version Cypress should read from it
const versionOutputs = [
  { displayName: 'Chrome', stdout: 'Google Chrome 120.0.6099.71', version: '120.0.6099.71' },
  { displayName: 'Chrome Beta', stdout: 'Google Chrome 121.0.6167.16 beta', version: '121.0.6167.16' },
  { displayName: 'Chrome Canary', stdout: 'Google Chrome Canary 122.0.6200.0', version: '122.0.6200.0' },
  { displayName: 'Chrome for Testing', stdout: 'Google Chrome for Testing 120.0.6099.71', version: '120.0.6099.71' },
  { displayName: 'Chromium', stdout: 'Chromium 120.0.6099.71', version: '120.0.6099.71' },
  { displayName: 'Chromium', stdout: 'Chromium 64.2.3 snap', version: '64.2.3' },
  { displayName: 'Firefox', stdout: 'Mozilla Firefox 140.0.1', version: '140.0.1' },
  { displayName: 'Firefox Developer Edition', stdout: 'Mozilla Firefox 73.0b12', version: '73.0b12' },
  { displayName: 'Firefox Nightly', stdout: 'Mozilla Firefox 75.0a1', version: '75.0a1' },
  { displayName: 'Edge', stdout: 'Microsoft Edge 120.0.2210.61', version: '120.0.2210.61' },
  { displayName: 'Edge', stdout: 'microsoft edge 120.0.2210.61', version: '120.0.2210.61' },
  { displayName: 'Edge Beta', stdout: 'Microsoft Edge 121.0.2277.4 beta', version: '121.0.2277.4' },
  { displayName: 'Edge Beta', stdout: 'Microsoft Edge Beta 121.0.2277.4', version: '121.0.2277.4' },
  { displayName: 'Edge Canary', stdout: 'Microsoft Edge 122.0.2300.0 canary', version: '122.0.2300.0' },
  { displayName: 'Edge Canary', stdout: 'Microsoft Edge Canary 122.0.2300.0', version: '122.0.2300.0' },
  { displayName: 'Edge Dev', stdout: 'Microsoft Edge 122.0.2290.1 dev', version: '122.0.2290.1' },
  { displayName: 'Edge Dev', stdout: 'Microsoft Edge Dev 122.0.2290.1', version: '122.0.2290.1' },
]

describe('browsers', () => {
  it('returns the expected list of browsers', () => {
    expect(knownBrowsers).toMatchSnapshot()
  })

  describe('versionRegex', () => {
    versionOutputs.forEach(({ displayName, stdout, version }) => {
      it(`${displayName}: reads ${version} from "${stdout}"`, () => {
        expect(getVersionNumber(stdout, knownBrowser(displayName))).toBe(version)
      })

      // https://github.com/cypress-io/cypress/issues/6669
      it(`${displayName}: reads ${version} when "${stdout}" follows another line`, () => {
        const multiline = `Running without a11y support!\n${stdout}\n`

        expect(getVersionNumber(multiline, knownBrowser(displayName))).toBe(version)
      })
    })

    // detectByPath picks the first known browser whose versionRegex matches
    const firstMatch = (stdout: string) => knownBrowsers.find(({ versionRegex }) => versionRegex.test(stdout))?.displayName

    it('recognizes each Chrome, Chromium and Firefox channel by its own output', () => {
      expect(firstMatch('Google Chrome 120.0.6099.71')).toBe('Chrome')
      expect(firstMatch('Google Chrome for Testing 120.0.6099.71')).toBe('Chrome for Testing')
      expect(firstMatch('Chromium 120.0.6099.71')).toBe('Chromium')
      expect(firstMatch('Mozilla Firefox 140.0.1')).toBe('Firefox')
      expect(firstMatch('Mozilla Firefox 73.0b12')).toBe('Firefox Developer Edition')
      expect(firstMatch('Mozilla Firefox 75.0a1')).toBe('Firefox Nightly')
      expect(firstMatch('Microsoft Edge 120.0.2210.61')).toBe('Edge')
    })

    it('does not mistake Chrome for Testing for Chrome, which shares its binary name', () => {
      expect(knownBrowser('Chrome').versionRegex.test('Google Chrome for Testing 120.0.6099.71')).toBe(false)
      expect(knownBrowser('Chrome for Testing').versionRegex.test('Google Chrome 120.0.6099.71')).toBe(false)
    })

    it('tells the Firefox channels apart, since they can share the firefox binary name', () => {
      const firefox = knownBrowser('Firefox').versionRegex
      const dev = knownBrowser('Firefox Developer Edition').versionRegex
      const nightly = knownBrowser('Firefox Nightly').versionRegex

      expect(firefox.test('Mozilla Firefox 73.0b12')).toBe(false)
      expect(firefox.test('Mozilla Firefox 75.0a1')).toBe(false)
      expect(dev.test('Mozilla Firefox 140.0.1')).toBe(false)
      expect(dev.test('Mozilla Firefox 75.0a1')).toBe(false)
      expect(nightly.test('Mozilla Firefox 140.0.1')).toBe(false)
      expect(nightly.test('Mozilla Firefox 73.0b12')).toBe(false)
    })

    it('only matches pre-release Edge channels on their own output', () => {
      const stable = 'Microsoft Edge 120.0.2210.61'

      expect(knownBrowser('Edge Beta').versionRegex.test(stable)).toBe(false)
      expect(knownBrowser('Edge Canary').versionRegex.test(stable)).toBe(false)
      expect(knownBrowser('Edge Dev').versionRegex.test(stable)).toBe(false)
      expect(knownBrowser('Edge Beta').versionRegex.test('Microsoft Edge 122.0.2290.1 dev')).toBe(false)
      expect(knownBrowser('Edge Dev').versionRegex.test('Microsoft Edge 121.0.2277.4 beta')).toBe(false)
    })

    it('does not match Chrome Beta on stable Chrome output', () => {
      expect(knownBrowser('Chrome Beta').versionRegex.test('Google Chrome 120.0.6099.71')).toBe(false)
    })
  })

  describe('browser.validator', () => {
    const firefoxBrowser = {
      ...knownBrowsers.find(({ name, channel }) => name === 'firefox' && channel === 'stable'),
      path: '/path/to/firefox',
    }

    describe('validator defined', () => {
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

        expect(result.isSupported).toBe(false)
        expect(result.warningMessage).toContain('Cypress does not support running Firefox version 101 on Windows due to a blocking bug in Firefox.')
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

        expect(result.isSupported).toBe(true)
        expect(result.warningMessage).toBeUndefined()
      })

      describe('firefox validation', () => {
        const FIREFOX_KNOWN_BROWSER_CHANNELS = knownBrowsers.filter((browser) => {
          return browser.family === 'firefox'
        })

        FIREFOX_KNOWN_BROWSER_CHANNELS.forEach((browser) => {
          it(`${browser.channel}: fails validation when Firefox major version is below 140`, () => {
            // @ts-expect-error - validator is optional and called without its second argument
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
  })
})
