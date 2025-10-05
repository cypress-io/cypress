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
    vi.resetAllMocks()
    vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' })
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

  it('getVersionString is re-exported from linuxHelper', () => {
    expect(darwinHelper.getVersionString).toEqual(linuxHelper.getVersionString)
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
