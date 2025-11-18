import { describe, it, expect, beforeEach, vi } from 'vitest'
import _ from 'lodash'
import cp from 'child_process'
import { EventEmitter } from 'events'
import * as linuxHelper from '../../lib/linux'
import { log } from '../log'
import { detect } from '../../lib/detect'
import { goalBrowsers } from '../fixtures'
import os from 'os'
import mockFs from 'mock-fs'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      platform: vi.fn(),
      release: vi.fn(),
      homedir: vi.fn(),
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

describe('linux browser detection', () => {
  let cpSpawnCallback: (cmd: string, args: readonly string[], opts, cp: cp.ChildProcess) => void

  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()

    vi.mocked(os.platform).mockReturnValue('linux')
    vi.mocked(os.release).mockReturnValue('1.0.0')

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
  })

  afterEach(() => {
    mockFs.restore()
  })

  it('detects browser by running --version', async () => {
    const goal = goalBrowsers[0]

    cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
      if (cmd === 'test-browser') {
        setTimeout(() => {
          cpSpawnMock.stdout.emit('data', 'test-browser v100.1.2.3')
        }, 0)
      }
    }

    // @ts-expect-error
    const browser = await linuxHelper.detect(goal)

    expect(browser).toEqual({
      name: 'test-browser-name',
      path: 'test-browser',
      version: '100.1.2.3',
    })
  })

  // https://github.com/cypress-io/cypress/pull/7039
  it('sets profilePath on snapcraft chromium', async () => {
    vi.mocked(os.homedir).mockReturnValue('/home/foo')

    cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
      if (cmd === 'chromium') {
        setTimeout(() => {
          cpSpawnMock.stdout.emit('data', 'Chromium 64.2.3 snap')
        }, 0)
      }
    }

    const [browser] = await detect()

    expect(browser).toEqual({
      channel: 'stable',
      name: 'chromium',
      family: 'chromium',
      displayName: 'Chromium',
      majorVersion: '64',
      path: 'chromium',
      profilePath: '/home/foo/snap/chromium/current',
      version: '64.2.3',
    })
  })

  // https://github.com/cypress-io/cypress/issues/19793
  describe('sets profilePath on snapcraft firefox', () => {
    const expectedSnapFirefox = {
      channel: 'stable',
      name: 'firefox',
      family: 'firefox',
      displayName: 'Firefox',
      majorVersion: '135',
      path: 'firefox',
      profilePath: '/home/foo/snap/firefox/current',
      version: '135.0.1',
    }

    beforeEach(() => {
      cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
        if (cmd === 'firefox') {
          setTimeout(() => {
            cpSpawnMock.stdout.emit('data', 'Mozilla Firefox 135.0.1')
          }, 0)
        }
      }

      vi.mocked(os.homedir).mockReturnValue('/home/foo')
    })

    it('with shim script', async () => {
      vi.stubEnv('PATH', '/bin')
      mockFs({
        '/bin/firefox': mockFs.symlink({ path: '/usr/bin/firefox' }),
        '/usr/bin/firefox': mockFs.file({ mode: 0o777, content: 'foo bar foo bar foo bar\nexec /snap/bin/firefox\n' }),
      })

      const [browser] = await detect()

      expect(browser).toEqual(expectedSnapFirefox)
    })

    it('with /snap/bin in path', async () => {
      vi.stubEnv('PATH', '/bin:/snap/bin')
      mockFs({
        '/snap/bin/firefox': mockFs.file({ mode: 0o777, content: 'binary' }),
      })

      const [browser] = await detect()

      expect(browser).toEqual(expectedSnapFirefox)
    })

    it('with symlink to /snap/bin in path', async () => {
      vi.stubEnv('PATH', '/bin')
      mockFs({
        '/bin/firefox': mockFs.symlink({ path: '/snap/bin/firefox' }),
        '/snap/bin/firefox': mockFs.file({ mode: 0o777, content: 'binary' }),
      })

      const [browser] = await detect()

      expect(browser).toEqual(expectedSnapFirefox)
    })
  })

  // https://github.com/cypress-io/cypress/issues/6669
  it('detects browser if the --version stdout is multiline', async () => {
    cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
      if (cmd === 'multiline-foo') {
        setTimeout(() => {
          cpSpawnMock.stdout.emit('data', `
        Running without a11y support!
        foo-browser v9001.1.2.3
      `)
        }, 0)
      }
    }

    const goal = _.defaults({ binary: 'multiline-foo' }, _.find(goalBrowsers, { name: 'foo-browser' }))

    // @ts-expect-error
    const [browser] = await detect([goal])

    expect(browser).toEqual({
      displayName: 'Foo Browser',
      majorVersion: '9001',
      name: 'foo-browser',
      path: 'multiline-foo',
      version: '9001.1.2.3',
    })
  })

  // despite using detect(), this test is in linux/spec instead of detect_spec because it is
  // testing side effects that occur within the Linux-specific detect function
  // https://github.com/cypress-io/cypress/issues/1400
  it('properly eliminates duplicates', async () => {
    const expected = [
      {
        displayName: 'Test Browser',
        name: 'test-browser-name',
        version: '100.1.2.3',
        path: 'test-browser',
        majorVersion: '100',
      },
      {
        displayName: 'Foo Browser',
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: '100',
      },
    ]

    cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
      if (cmd === 'test-browser') {
        setTimeout(() => {
          cpSpawnMock.stdout.emit('data', 'test-browser v100.1.2.3')
        }, 0)
      }

      if (cmd === 'foo-browser') {
        setTimeout(() => {
          cpSpawnMock.stdout.emit('data', 'foo-browser v100.1.2.3')
        }, 0)
      }
    }

    // @ts-expect-error
    const browsers = await detect(goalBrowsers)

    log('Browsers: %o', browsers)
    log('Expected browsers: %o', expected)
    expect(browsers).toEqual(expected)
  })

  it('considers multiple binary names', async () => {
    const goalBrowsers = [
      {
        name: 'foo-browser',
        versionRegex: /v(\S+)$/,
        binary: ['foo-browser', 'foo-bar-browser'],
      },
    ]

    const expected = [
      {
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: '100',
      },
    ]

    cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
      if (cmd === 'foo-browser' || cmd === 'foo-bar-browser') {
        setTimeout(() => {
          cpSpawnMock.stdout.emit('data', 'foo-browser v100.1.2.3')
        }, 0)
      }
    }

    //@ts-expect-error
    const browsers = await detect(goalBrowsers)

    log('Browsers: %o', browsers)
    log('Expected browsers: %o', expected)
    expect(browsers).toEqual(expected)
  })

  describe('#getVersionString', () => {
    it('runs the command with `--version` and returns trimmed output', async () => {
      cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
        if (cmd === 'foo') {
          setTimeout(() => {
            cpSpawnMock.stdout.emit('data', '  bar  ')
          }, 0)
        }
      }

      const versionString = await linuxHelper.getVersionString('foo')

      expect(versionString).toEqual('bar')
    })

    it('rejects with errors', async () => {
      const err = new Error()

      cpSpawnCallback = (cmd, args, opts, cpSpawnMock) => {
        if (cmd === 'foo') {
          // @ts-expect-error - overriding the mock on this method
          cpSpawnMock.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
            if (event === 'error') {
              setTimeout(() => callback(err), 0)
            }
          })
        }
      }

      await expect(linuxHelper.getVersionString('foo')).rejects.toThrow(err)
    })
  })
})
