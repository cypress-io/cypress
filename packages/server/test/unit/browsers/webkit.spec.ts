import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import utils from '../../../lib/browsers/utils'
import { fs } from '../../../lib/util/fs'
import * as plugins from '../../../lib/plugins'
import * as webkit from '../../../lib/browsers/webkit'

const mocks = vi.hoisted(() => {
  return {
    pwWebkit: {} as Record<string, unknown>,
    WebKitAutomation: { create: undefined as unknown as Mock },
    // webkit.ts imports the CJS entry by absolute path, while a bare
    // vi.mock('playwright-webkit') resolves to the package's ESM entry
    pwWebkitCjsPath: require.resolve('playwright-webkit', { paths: [process.cwd()] }),
  }
})

vi.mock(mocks.pwWebkitCjsPath, () => {
  return {
    get webkit () {
      return mocks.pwWebkit.webkit
    },
    default: mocks.pwWebkit,
  }
})

vi.mock('../../../lib/browsers/webkit-automation', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('../../../lib/browsers/webkit-automation')>(),
    WebKitAutomation: mocks.WebKitAutomation,
  }
})

describe('lib/browsers/webkit', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#open', () => {
    let browser
    let options
    let automation
    let wkInstance
    let executeSpy: Mock
    let hasSpy: Mock

    const afterBrowserLaunchCalls = () => executeSpy.mock.calls.filter((call) => call[0] === 'after:browser:launch')

    beforeEach(async () => {
      browser = {}
      options = { experimentalWebKitSupport: true }
      automation = { use: vi.fn() }

      const launchOptions = {
        extensions: [],
        args: [],
        preferences: { },
      }

      mocks.pwWebkit.webkit = {
        connect: vi.fn().mockResolvedValue({
          on: vi.fn(),
        }),
        launchServer: vi.fn().mockResolvedValue({
          wsEndpoint: vi.fn().mockReturnValue('ws://debugger'),
          process: vi.fn().mockReturnValue({ pid: 'pid' }),
        }),
      }

      wkInstance = { reset: vi.fn().mockResolvedValue(undefined) }
      mocks.WebKitAutomation.create = vi.fn().mockResolvedValue(wkInstance)

      vi.spyOn(utils, 'executeBeforeBrowserLaunch').mockResolvedValue(launchOptions as any)
      executeSpy = vi.spyOn(plugins, 'execute').mockResolvedValue(undefined) as unknown as Mock
      hasSpy = vi.spyOn(plugins, 'has').mockImplementation(() => undefined as any) as unknown as Mock
    })

    it('sends after:browser:launch with debugger url', async () => {
      hasSpy.mockReturnValue(true)

      await webkit.open(browser as any, 'http://the.url', options as any, automation as any)

      expect(afterBrowserLaunchCalls()).toContainEqual(['after:browser:launch', browser, {
        webSocketDebuggerUrl: 'ws://debugger',
      }])
    })

    it('executeAfterBrowserLaunch is noop if after:browser:launch is not registered', async () => {
      hasSpy.mockReturnValue(false)

      await webkit.open(browser as any, 'http://the.url', options as any, automation as any)

      expect(afterBrowserLaunchCalls()).toHaveLength(0)
    })

    it('passes the cdpSocketServer through to the automation', async () => {
      hasSpy.mockReturnValue(false)

      const cdpSocketServer = { attachCDPClient: vi.fn() }

      await webkit.open(browser as any, 'http://the.url', options as any, automation as any, cdpSocketServer as any)

      expect(mocks.WebKitAutomation.create).toHaveBeenCalledWith(expect.objectContaining({ cdpSocketServer }))
    })

    describe('#connectToNewSpec', () => {
      let specOptions

      beforeEach(async () => {
        hasSpy.mockReturnValue(false)

        specOptions = { url: 'http://the.url', onInitializeNewBrowserTab: vi.fn().mockResolvedValue(undefined), downloadsFolder: '/tmp/downloads' }
      })

      it('updates the automation socket server for the new spec', async () => {
        const original = { attachCDPClient: vi.fn() }
        const replacement = { attachCDPClient: vi.fn() }

        await webkit.open(browser as any, 'http://the.url', options as any, automation as any, original as any)
        wkInstance.cdpSocketServer = original

        await webkit.connectToNewSpec(browser as any, specOptions, automation as any, replacement as any)

        expect(wkInstance.cdpSocketServer).toBe(replacement)
        expect(wkInstance.reset).toHaveBeenCalled()
      })

      it('preserves the existing automation socket server when none is passed', async () => {
        const original = { attachCDPClient: vi.fn() }

        await webkit.open(browser as any, 'http://the.url', options as any, automation as any, original as any)
        wkInstance.cdpSocketServer = original

        await webkit.connectToNewSpec(browser as any, specOptions, automation as any)

        expect(wkInstance.cdpSocketServer).toBe(original)
      })
    })
  })

  describe('utils.getWebKitBrowserVersion', () => {
    it('returns the webkit browserVersion from playwright-core browsers.json', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify({
        browsers: [
          { name: 'chromium', browserVersion: '140.0.7339.5' },
          { name: 'webkit', browserVersion: '26.5' },
        ],
      }) as any)

      expect(await utils.getWebKitBrowserVersion()).toBe('26.5')
    })

    it(`returns '0' when there is no webkit entry`, async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify({
        browsers: [{ name: 'chromium', browserVersion: '140.0.7339.5' }],
      }) as any)

      expect(await utils.getWebKitBrowserVersion()).toBe('0')
    })

    it(`returns '0' when the webkit entry has no browserVersion`, async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify({
        browsers: [{ name: 'webkit' }],
      }) as any)

      expect(await utils.getWebKitBrowserVersion()).toBe('0')
    })

    it(`returns '0' when browsers.json cannot be read`, async () => {
      vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('ENOENT'))

      expect(await utils.getWebKitBrowserVersion()).toBe('0')
    })

    // verifies the monorepo's pinned playwright-core ships a browsers.json with a
    // webkit browserVersion, so the detection path resolves to a real version rather
    // than falling back to '0' (see cypress-io/cypress#33974 and #33969)
    it('detects a real version from the installed playwright-core', async () => {
      const pwCorePath = path.dirname(require.resolve('playwright-core', { paths: [process.cwd()] }))
      const browsersJson = JSON.parse(await fs.readFile(path.join(pwCorePath, 'browsers.json'), 'utf8'))
      const expectedVersion = browsersJson.browsers.find((b) => b.name === 'webkit').browserVersion

      expect(expectedVersion).not.toBe('0')
      expect(await utils.getWebKitBrowserVersion()).toBe(expectedVersion)
    })

    // regression: in system tests the project runs from a temp dir outside the
    // monorepo where only playwright-webkit is symlinked, so playwright-core is
    // not resolvable from process.cwd() and the version used to fall back to '0'
    // (displaying "WebKit 0"). Resolving playwright-core via the playwright-webkit
    // module path fixes this. See cypress-io/cypress#34101.
    it('resolves playwright-core via the playwright-webkit module path when cwd cannot resolve it', async () => {
      const pwWebkitModulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] })

      // simulate the project running outside the monorepo (a system-test temp dir)
      vi.spyOn(process, 'cwd').mockReturnValue(os.tmpdir())

      expect(await utils.getWebKitBrowserVersion(pwWebkitModulePath)).not.toBe('0')
    })
  })

  describe('#connectProtocolToBrowser', () => {
    it('throws error', () => {
      expect(webkit.connectProtocolToBrowser).toThrow('Protocol is not yet supported in WebKit.')
    })
  })

  describe('#closeProtocolConnection', () => {
    it('throws error', async () => {
      expect(webkit.closeProtocolConnection).toThrow('Protocol is not yet supported in WebKit.')
    })
  })
})
