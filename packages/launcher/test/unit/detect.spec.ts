import { describe, it, expect, beforeEach, vi } from 'vitest'
import _ from 'lodash'
import cp from 'child_process'
import { EventEmitter } from 'stream'
import { detect, detectByPath, getMajorVersion } from '../../lib/detect'
import { goalBrowsers } from '../fixtures'
import os from 'os'
import { log } from '../log'
import { detect as linuxDetect } from '../../lib/linux'
import { detect as darwinDetect } from '../../lib/darwin'
import { detect as windowsDetect } from '../../lib/windows'
import type { Browser } from '@packages/types'

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

vi.mock('../../lib/linux', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    detect: vi.fn(),
  }
})

vi.mock('../../lib/darwin', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    detect: vi.fn(),
  }
})

vi.mock('../../lib/windows', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    detect: vi.fn(),
  }
})

const isWindows = () => {
  return os.platform() === 'win32'
}

describe('detect', () => {
  beforeEach(async () => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()

    const { detect: linuxDetectActual } = await vi.importActual<typeof import('../../lib/linux')>('../../lib/linux')
    const { detect: darwinDetectActual } = await vi.importActual<typeof import('../../lib/darwin')>('../../lib/darwin')
    const { detect: windowsDetectActual } = await vi.importActual<typeof import('../../lib/windows')>('../../lib/windows')

    vi.mocked(linuxDetect).mockImplementation(linuxDetectActual)
    vi.mocked(darwinDetect).mockImplementation(darwinDetectActual)
    vi.mocked(windowsDetect).mockImplementation(windowsDetectActual)

    const { spawn } = await vi.importActual<typeof import('child_process')>('child_process')

    vi.mocked(cp.spawn).mockImplementation(spawn)
  })

  // making simple to debug tests
  // using DEBUG=... flag

  // we are only going to run tests on platforms with at least
  // one browser. This test, is really E2E because it finds
  // real browsers
  it('detects available browsers', async () => {
    const browsers = await detect()

    log('detected browsers %j', browsers)
    expect(browsers).toBeInstanceOf(Array)

    const mainProps = browsers.map((val) => _.pick(val, ['name', 'version']))

    log('%d browsers\n%j', browsers.length, mainProps)

    if (isWindows()) {
      // we might not find any browsers on Windows CI
      expect(browsers.length).toBeGreaterThanOrEqual(0)
    } else {
      expect(browsers.length).toBeGreaterThan(0)
    }
  })

  describe('#getMajorVersion', () => {
    it('parses major version from provided string', () => {
      expect(getMajorVersion('123.45.67')).toEqual('123')
      expect(getMajorVersion('Browser 77.1.0')).toEqual('Browser 77')
      expect(getMajorVersion('999')).toEqual('999')
    })
  })

  describe('#detect', () => {
    const testBrowser = {
      name: 'test-browser',
      family: 'chromium',
      channel: 'test-channel',
      displayName: 'Test Browser',
      versionRegex: /Test Browser (\S+)/m,
      binary: 'test-browser-beta',
    }

    it('validates browser with own validator property', async () => {
      // @ts-expect-error
      vi.mocked(linuxDetect).mockImplementation((browser) => {
        return Promise.resolve({
          name: browser.name,
          path: '/path/to/test-browser',
          version: '130',
        })
      })

      vi.mocked(darwinDetect).mockImplementation((browser) => {
        return Promise.resolve({
          name: browser.name,
          path: '/path/to/test-browser',
          version: '130',
        })
      })

      // @ts-expect-error
      vi.mocked(windowsDetect).mockImplementation((browser) => {
        return Promise.resolve({
          name: browser.name,
          path: '/path/to/test-browser',
          version: '130',
        })
      })

      const mockValidator = vi.fn().mockReturnValue({ isSupported: true })

      const foundBrowsers = await detect([{ ...testBrowser as Browser, validator: mockValidator }])

      expect(foundBrowsers).toHaveLength(1)

      const foundTestBrowser = foundBrowsers[0]

      expect(foundTestBrowser.name).toEqual('test-browser')
      expect(foundTestBrowser.displayName).toEqual('Test Browser')
      expect(foundTestBrowser.majorVersion, 'majorVersion').toEqual('130')
      expect(foundTestBrowser.unsupportedVersion, 'unsupportedVersion').toBeUndefined()
      expect(foundTestBrowser.warning, 'warning').toBeUndefined()
      expect(mockValidator).toHaveBeenCalled()
    })
  })

  describe('#detectByPath', () => {
    let cpSpawnCallback: (cmd: string, args: readonly string[], opts, cp: cp.ChildProcess) => void

    beforeEach(() => {
      vi.unstubAllEnvs()
      vi.resetAllMocks()

      vi.mocked(cp.spawn).mockImplementation((cmd, args, opts) => {
        const cpSpawnMock = {
          on: vi.fn(),
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        }

        cpSpawnMock.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
          if (event === 'exit') {
            setTimeout(() => callback(), 0)
          }

          if (event === 'close') {
            setTimeout(() => callback(), 0)
          }
        })

        cpSpawnCallback(cmd, args, opts, cpSpawnMock as unknown as cp.ChildProcess)

        return cpSpawnMock as unknown as cp.ChildProcess
      })

      cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
        // FIXME: these tests really should be reworked to run the same regardless of OS/CPU architecture
        const command = os.arch() === 'arm64' ? args[0] : cmd

        if (command === '/Applications/My Shiny New Browser.app') {
          setTimeout(() => {
            cpSpawnMock.stdout.emit('data', 'foo-browser v100.1.2.3')
          }, 0)

          return
        }

        if (command === '/foo/bar/browser') {
          setTimeout(() => {
            cpSpawnMock.stdout.emit('data', 'foo-browser v9001.1.2.3')
          }, 0)

          return
        }

        if (command === '/not/a/browser') {
          setTimeout(() => {
            cpSpawnMock.stdout.emit('data', 'not a browser version string')
          }, 0)

          return
        }

        if (command === '/not/a/real/path') {
          setTimeout(() => {
            cpSpawnMock.stdout.emit('data', '')
          }, 0)

          return
        }
      }
    })

    it('detects by path', async () => {
      // @ts-expect-error
      const foundBrowser = await detectByPath('/foo/bar/browser', goalBrowsers)

      const expectedBrowser = goalBrowsers.find(({ name }) => name === 'foo-browser')

      expect(foundBrowser).toEqual({
        ...expectedBrowser,
        displayName: 'Custom Foo Browser',
        info: 'Loaded from /foo/bar/browser',
        custom: true,
        version: '9001.1.2.3',
        majorVersion: '9001',
        path: '/foo/bar/browser',
      })
    })

    it('rejects when there was no matching versionRegex', async () => {
      try {
        // @ts-expect-error
        await detectByPath('/not/a/browser', goalBrowsers)

        throw Error('Should not find a browser')
      } catch (err) {
        expect(err.notDetectedAtPath).toBe(true)
      }
    })

    it('rejects when there was an error executing the command', async () => {
      try {
        // @ts-expect-error
        await detectByPath('/not/a/real/path', goalBrowsers)
        throw Error('Should not find a browser')
      } catch (err) {
        expect(err.notDetectedAtPath).toBe(true)
      }
    })

    it('works with spaces in the path', async () => {
      // @ts-expect-error
      const foundBrowser = await detectByPath('/Applications/My Shiny New Browser.app', goalBrowsers)

      const expectedBrowser = goalBrowsers.find(({ name }) => name === 'foo-browser')

      expect(foundBrowser).toEqual({
        ...expectedBrowser,
        displayName: 'Custom Foo Browser',
        info: 'Loaded from /Applications/My Shiny New Browser.app',
        custom: true,
        version: '100.1.2.3',
        majorVersion: '100',
        path: '/Applications/My Shiny New Browser.app',
      })
    })
  })
})
