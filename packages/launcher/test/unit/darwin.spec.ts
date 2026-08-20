import { describe, it, expect, beforeEach, vi } from 'vitest'
import os from 'os'
import cp from 'child_process'
import fs from 'fs-extra'
import { PassThrough } from 'stream'
import { FoundBrowser } from '@packages/types'
import * as darwinHelper from '../../lib/darwin'
import * as linuxHelper from '../../lib/linux'
import * as darwinUtil from '../../lib/darwin/util'
import { launch } from '../../lib/browsers'
import { knownBrowsers } from '../../lib/known-browsers'
import { utils } from '../../lib/utils'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      arch: vi.fn(),
      platform: vi.fn(),
    },
  }
})

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      readFile: vi.fn(),
      pathExists: vi.fn(),
    },
  }
})

vi.mock('child_process', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      spawn: vi.fn(),
    },
  }
})

function generatePlist (entries: Record<string, string>) {
  const dict = Object.entries(entries)
  .map(([key, value]) => `<key>${key}</key><string>${value}</string>`)
  .join('')

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        ${dict}
      </dict>
    </plist>
  `
}

describe('darwin browser detection', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()
    vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' })
    vi.mocked(fs.pathExists).mockResolvedValue(true)
    darwinUtil.resetSpotlightCache()
  })

  it('detects browsers as expected', async () => {
    // this test uses the macOS detectors to stub out the expected calls
    const flatFindAppParams: darwinUtil.FindAppParams[] = []

    for (const browser in darwinHelper.browsers) {
      for (const channel in darwinHelper.browsers[browser]) {
        flatFindAppParams.push(darwinHelper.browsers[browser][channel])
      }
    }

    // @ts-expect-error
    vi.mocked(fs.readFile).mockImplementation((file: string, _options: any): Promise<string> => {
      const foundAppParams = flatFindAppParams.find((findAppParams) => `/Applications/${findAppParams.appName}/Contents/Info.plist` === file)

      if (foundAppParams) {
        return Promise.resolve(generatePlist({
          [foundAppParams.versionProperty]: 'someVersion',
          CFBundleIdentifier: foundAppParams.bundleId,
        }))
      }

      throw new Error('File not found')
    })

    const mappedBrowsers = []

    for (const browser of knownBrowsers) {
      const foundBrowser = await darwinHelper.detect(browser)
      const findAppParams = darwinHelper.browsers[browser.name][browser.channel]

      mappedBrowsers.push({
        ...browser,
        ...foundBrowser,
        findAppParams,
      })
    }

    expect(mappedBrowsers).toMatchSnapshot()
  })

  it('getVersionString is re-exported from linuxHelper', () => {
    expect(darwinHelper.getVersionString).toEqual(linuxHelper.getVersionString)
  })

  describe('findApp verifies the bundle', () => {
    const chromeStable = darwinHelper.browsers.chrome.stable
    const appPath = `/Applications/${chromeStable.appName}`
    const executablePath = `${appPath}/${chromeStable.executable}`
    const otherInstall = '/Applications/Google Chrome-37.localized/Google Chrome.app'

    // a plist for `bundleId` at every path in `paths`, ENOENT everywhere else
    function stubPlists (paths: Record<string, { bundleId: string, version?: string }>) {
      // @ts-expect-error
      vi.mocked(fs.readFile).mockImplementation((file: string): Promise<string> => {
        const found = paths[file.replace('/Contents/Info.plist', '')]

        if (found) {
          return Promise.resolve(generatePlist({
            CFBundleIdentifier: found.bundleId,
            [chromeStable.versionProperty]: found.version ?? 'someVersion',
          }))
        }

        return Promise.reject(new Error('File not found'))
      })
    }

    beforeEach(() => {
      vi.spyOn(utils, 'execa').mockResolvedValue({ stdout: '' } as any)
    })

    it('resolves the well-known path when the bundle id and executable match', async () => {
      stubPlists({ [appPath]: { bundleId: chromeStable.bundleId, version: '145.0.7632.160' } })

      await expect(darwinUtil.findApp(chromeStable)).resolves.toEqual({
        path: executablePath,
        version: '145.0.7632.160',
      })

      // Spotlight is only a fallback, so a healthy install must not pay for it
      expect(utils.execa).not.toHaveBeenCalled()
    })

    it('rejects a bundle belonging to a different channel', async () => {
      // a Chrome Beta install sitting at /Applications/Google Chrome.app
      stubPlists({ [appPath]: { bundleId: 'com.google.Chrome.beta' } })

      await expect(darwinUtil.findApp(chromeStable)).rejects.toThrow()
    })

    it('rejects a bundle whose executable is missing', async () => {
      stubPlists({ [appPath]: { bundleId: chromeStable.bundleId } })
      vi.mocked(fs.pathExists).mockResolvedValue(false)

      await expect(darwinUtil.findApp(chromeStable)).rejects.toThrow()
    })

    it('falls back to Spotlight when the well-known path does not verify', async () => {
      stubPlists({
        [appPath]: { bundleId: 'com.google.Chrome.beta' },
        [otherInstall]: { bundleId: chromeStable.bundleId, version: '145.0.7632.160' },
      })

      vi.mocked(utils.execa).mockResolvedValue({ stdout: `${otherInstall}\n` } as any)

      await expect(darwinUtil.findApp(chromeStable)).resolves.toEqual({
        path: `${otherInstall}/${chromeStable.executable}`,
        version: '145.0.7632.160',
      })
    })

    it('queries mdfind once for every browser, with arguments rather than a shell pipeline', async () => {
      stubPlists({ [appPath]: { bundleId: 'com.google.Chrome.beta' } })

      await darwinUtil.findApp(chromeStable).catch(() => {})
      await darwinUtil.findApp(darwinHelper.browsers.firefox.stable).catch(() => {})
      await darwinUtil.findApp(darwinHelper.browsers.edge.canary).catch(() => {})

      expect(utils.execa).toHaveBeenCalledTimes(1)

      const [cmd, args, opts] = vi.mocked(utils.execa).mock.calls[0] as any
      const query = String(args[0])

      expect(cmd).toEqual('mdfind')
      expect(args).toHaveLength(1)
      expect(query).toContain(`kMDItemCFBundleIdentifier=="${chromeStable.bundleId}"`)
      expect(query).toContain('kMDItemCFBundleIdentifier=="org.mozilla.firefox"')
      expect(query).toContain(' || ')
      expect(opts).toEqual(expect.objectContaining({ timeout: expect.any(Number) }))
    })
  })

  describe('forces correct architecture', () => {
    beforeEach(() => {
      vi.unstubAllEnvs()
      vi.stubEnv('env2', 'false')
      vi.stubEnv('env3', 'true')
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.mocked(cp.spawn).mockImplementation(() => {
        const mock: any = {
          on: vi.fn(),
          once: vi.fn(),
          stdout: new PassThrough(),
          stderr: new PassThrough(),
          kill: vi.fn(),
        }

        mock.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
          if (event === 'exit') {
            setTimeout(() => callback(), 0)
          }

          if (event === 'close') {
            setTimeout(() => callback(), 0)
          }
        })

        mock.stderr.end()
        mock.stdout.end()

        return mock as cp.ChildProcess
      })
    })

    describe('in version detection', () => {
      it('uses arch and ARCHPREFERENCE on arm64', async () => {
        vi.mocked(os.arch).mockReturnValue('arm64')

        // this will error since we aren't setting stdout
        await (darwinHelper.detect(knownBrowsers[0]).catch(() => {}))

        expect(cp.spawn).toHaveBeenNthCalledWith(1, 'arch', [knownBrowsers[0].binary, '--version'], expect.objectContaining({
          env: expect.objectContaining({
            ARCHPREFERENCE: 'arm64,x86_64',
            env2: 'false',
            env3: 'true',
          }),
        }))
      })

      it('does not use `arch` on x64', async () => {
        vi.mocked(os.arch).mockReturnValue('x64')

        // this will error since we aren't setting stdout
        await (darwinHelper.detect(knownBrowsers[0]).catch(() => {}))

        expect(cp.spawn).toHaveBeenNthCalledWith(1, knownBrowsers[0].binary, ['--version'], expect.objectContaining({
          env: expect.objectContaining({
            env2: 'false',
            env3: 'true',
          }),
        }))
      })
    })

    describe('in browser launching', () => {
      it('uses arch and ARCHPREFERENCE on arm64', async () => {
        vi.mocked(os.arch).mockReturnValue('arm64')

        await launch({ path: 'chrome' } as unknown as FoundBrowser, 'url', 123, ['arg1'], { env1: 'true', env2: 'true' })

        expect(cp.spawn).toHaveBeenNthCalledWith(1, 'arch', ['chrome', 'url', 'arg1'], expect.objectContaining({
          env: expect.objectContaining({
            ARCHPREFERENCE: 'arm64,x86_64',
            env1: 'true',
            env2: 'false',
            env3: 'true',
          }),
        }))
      })

      it('does not use `arch` on x64', async () => {
        vi.mocked(os.arch).mockReturnValue('x64')

        await launch({ path: 'chrome' } as unknown as FoundBrowser, 'url', 123, ['arg1'], { env1: 'true', env2: 'true' })

        expect(cp.spawn).toHaveBeenNthCalledWith(1, 'chrome', ['url', 'arg1'], expect.objectContaining({
          env: expect.objectContaining({
            env1: 'true',
            env2: 'false',
            env3: 'true',
          }),
        }))

        // @ts-expect-error
        expect(cp.spawn.mock.calls[0][2].env).not.toHaveProperty('ARCHPREFERENCE')
      })
    })
  })
})
