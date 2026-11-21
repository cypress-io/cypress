import { describe, it, expect, vi, afterEach } from 'vitest'
import _ from 'lodash'
import { EventEmitter } from 'events'
import { PassThrough } from 'stream'
import { format } from 'util'
import type { ChildProcessByStdio } from 'child_process'
import type { Readable } from 'stream'
import type { FoundBrowser } from '@packages/types'
import { knownBrowsers } from '../../lib/known-browsers'
import { launch, debug } from '../../lib/browsers'
import { utils } from '../../lib/utils'

describe('launch', () => {
  const recordKey = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
  const apiToken = 'tok_7Hq2LmR9vXc4NpZ8sWd3'
  const { enabled, log } = debug

  afterEach(() => {
    debug.enabled = enabled
    debug.log = log
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('writes the names of the browser env vars to the debug log, but no env var values', () => {
    const browserProcess = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough() })
    const lines: string[] = []

    // Safe because launch only listens to stdout, stderr and 'exit' on the returned process
    vi.spyOn(utils, 'spawnWithArch').mockReturnValue(browserProcess as unknown as ChildProcessByStdio<null, Readable, Readable>)
    vi.stubEnv('CYPRESS_RECORD_KEY', recordKey)
    debug.enabled = true
    debug.log = (...args: unknown[]) => lines.push(format(...args))

    launch({ name: 'chrome', path: '/usr/bin/google-chrome' } as FoundBrowser, 'about:blank', 9222, [], { MY_API_TOKEN: apiToken })

    const output = lines.join('\n')

    expect(output).toContain('spawning browser')
    expect(output).toContain('MY_API_TOKEN')
    expect(output).not.toContain(recordKey)
    expect(output).not.toContain(apiToken)
  })
})

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
