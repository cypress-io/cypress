import { describe, it, expect, beforeEach, vi } from 'vitest'
import os from 'os'
import cp from 'child_process'
import fs from 'fs-extra'
import { PassThrough } from 'stream'
import type { FoundBrowser } from '@packages/types'
import * as darwinHelper from '../../lib/darwin'
import * as linuxHelper from '../../lib/linux'
import { utils } from '../../lib/utils'
import type * as darwinUtil from '../../lib/darwin/util'
import { findApp } from '../../lib/darwin/util'
import { launch } from '../../lib/browsers'
import { knownBrowsers } from '../../lib/known-browsers'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual() returns unknown
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
      // @ts-expect-error - importActual() returns unknown
      ...actual.default,
      readFile: vi.fn(),
    },
  }
})

vi.mock('child_process', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual() returns unknown
      ...actual.default,
      spawn: vi.fn(),
    },
  }
})

function generatePlist (key, value) {
  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>${key}</key>
        <string>${value}</string>
      </dict>
    </plist>
  `
}

describe('darwin browser detection', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    // spies on shared objects (like `utils.execa`) must not leak into other tests
    vi.restoreAllMocks()
    vi.resetAllMocks()
    vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' })
  })

  it('detects browsers as expected', async () => {
    // this test uses the macOS detectors to stub out the expected calls
    const flatFindAppParams: darwinUtil.FindAppParams[] = []

    // mdfind only exists on macOS: stub it out so the /Applications fallback is
    // exercised deterministically on every OS
    vi.spyOn(utils, 'execa').mockRejectedValue(new Error('mdfind not available'))

    for (const browser in darwinHelper.browsers) {
      for (const channel in darwinHelper.browsers[browser]) {
        flatFindAppParams.push(darwinHelper.browsers[browser][channel])
      }
    }

    // @ts-expect-error - mock implementation doesn't match fs.readFile's overloads
    vi.mocked(fs.readFile).mockImplementation((file: string, _options: any): Promise<string> => {
      const foundAppParams = flatFindAppParams.find((findAppParams) => `/Applications/${findAppParams.appName}/Contents/Info.plist` === file)

      if (foundAppParams) {
        return Promise.resolve(generatePlist(foundAppParams.versionProperty, 'someVersion'))
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

  describe('findApp mdfind lookup', () => {
    const chrome = {
      appName: 'Google Chrome.app',
      executable: 'Contents/MacOS/Google Chrome',
      bundleId: 'com.google.Chrome',
      versionProperty: 'KSVersion',
    }

    // installed directly in /Applications
    const applicationsApp = '/Applications/Google Chrome.app'
    // installed in a subfolder of /Applications
    const thirdPartyApp = '/Applications/3rdParty/Google Chrome.app'
    // managed/user install, outside of /Applications
    const userApp = '/Users/someone/Applications/Google Chrome.app'

    const plistPath = (appPath: string) => `${appPath}/Contents/Info.plist`

    const stubMdFind = (stdout: string) => {
      // execa resolves with a child process: the code only reads stdout
      vi.spyOn(utils, 'execa').mockResolvedValue({ stdout } as any)
    }

    const stubPlists = (versions: Record<string, string>) => {
      // @ts-expect-error - mock implementation doesn't match fs.readFile's overloads
      vi.mocked(fs.readFile).mockImplementation((file: string): Promise<string> => {
        const version = versions[file]

        if (version) {
          return Promise.resolve(generatePlist(chrome.versionProperty, version))
        }

        return Promise.reject(new Error('File not found'))
      })
    }

    const expectedApp = (appPath: string, version: string) => {
      return {
        path: `${appPath}/Contents/MacOS/Google Chrome`,
        version,
      }
    }

    it('calls mdfind with the bundle id as an argument array', async () => {
      stubMdFind(`${thirdPartyApp}\n`)
      stubPlists({ [plistPath(thirdPartyApp)]: '100.0.1' })

      await findApp(chrome)

      expect(utils.execa).toHaveBeenCalledWith('mdfind', ['kMDItemCFBundleIdentifier=="com.google.Chrome"'])
    })

    it('detects a single app that is not directly in /Applications', async () => {
      stubMdFind(`${thirdPartyApp}\n`)
      stubPlists({ [plistPath(thirdPartyApp)]: '100.0.1' })

      await expect(findApp(chrome)).resolves.toEqual(expectedApp(thirdPartyApp, '100.0.1'))
    })

    it('prefers an app directly in /Applications even when mdfind lists it last', async () => {
      stubMdFind([userApp, thirdPartyApp, applicationsApp].join('\n'))
      stubPlists({
        [plistPath(userApp)]: '99.0.0',
        [plistPath(thirdPartyApp)]: '100.0.1',
        [plistPath(applicationsApp)]: '101.0.2',
      })

      await expect(findApp(chrome)).resolves.toEqual(expectedApp(applicationsApp, '101.0.2'))

      expect(fs.readFile).toHaveBeenCalledTimes(1)
      expect(fs.readFile).toHaveBeenCalledWith(plistPath(applicationsApp), 'utf8')
    })

    it('ignores blank lines and Windows line endings in the mdfind output', async () => {
      stubMdFind(`${thirdPartyApp}\r\n\r\n  ${userApp}  \r\n`)
      stubPlists({ [plistPath(userApp)]: '99.0.0' })

      await expect(findApp(chrome)).resolves.toEqual(expectedApp(userApp, '99.0.0'))
    })

    it('tries the next mdfind result when the first one has no readable Info.plist', async () => {
      stubMdFind([userApp, thirdPartyApp].join('\n'))
      // only the second result has a readable Info.plist
      stubPlists({ [plistPath(thirdPartyApp)]: '100.0.1' })

      await expect(findApp(chrome)).resolves.toEqual(expectedApp(thirdPartyApp, '100.0.1'))

      expect(fs.readFile).toHaveBeenNthCalledWith(1, plistPath(userApp), 'utf8')
      expect(fs.readFile).toHaveBeenNthCalledWith(2, plistPath(thirdPartyApp), 'utf8')
    })

    it('tries the next mdfind result when the first Info.plist has no version', async () => {
      stubMdFind([userApp, thirdPartyApp].join('\n'))
      // @ts-expect-error - mock implementation doesn't match fs.readFile's overloads
      vi.mocked(fs.readFile).mockImplementation((file: string): Promise<string> => {
        if (file === plistPath(userApp)) {
          return Promise.resolve(generatePlist('CFBundleName', 'Google Chrome'))
        }

        if (file === plistPath(thirdPartyApp)) {
          return Promise.resolve(generatePlist(chrome.versionProperty, '100.0.1'))
        }

        return Promise.reject(new Error('File not found'))
      })

      await expect(findApp(chrome)).resolves.toEqual(expectedApp(thirdPartyApp, '100.0.1'))
    })

    it('falls back to /Applications when mdfind returns nothing', async () => {
      stubMdFind('')
      stubPlists({ [plistPath(applicationsApp)]: '101.0.2' })

      await expect(findApp(chrome)).resolves.toEqual(expectedApp(applicationsApp, '101.0.2'))
    })

    it('falls back to /Applications when mdfind fails', async () => {
      vi.spyOn(utils, 'execa').mockRejectedValue(new Error('mdfind not available'))
      stubPlists({ [plistPath(applicationsApp)]: '101.0.2' })

      await expect(findApp(chrome)).resolves.toEqual(expectedApp(applicationsApp, '101.0.2'))
    })

    it('rejects when mdfind finds nothing usable and /Applications has no plist', async () => {
      stubMdFind(`${thirdPartyApp}\n`)

      await expect(findApp(chrome)).rejects.toThrow('Info.plist not found')
    })
  })

  it('getVersionString is re-exported from linuxHelper', () => {
    expect(darwinHelper.getVersionString).toEqual(linuxHelper.getVersionString)
  })

  describe('forces correct architecture', () => {
    beforeEach(() => {
      vi.unstubAllEnvs()
      vi.stubEnv('env2', 'false')
      vi.stubEnv('env3', 'true')
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.spyOn(utils, 'which').mockResolvedValue('/usr/local/bin/google-chrome')
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

        // @ts-expect-error - cp.spawn is typed as the real function, not a vi mock
        expect(cp.spawn.mock.calls[0][2].env).not.toHaveProperty('ARCHPREFERENCE')
      })
    })
  })
})
