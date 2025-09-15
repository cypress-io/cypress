import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import mockfs from 'mock-fs'
import dayjs from 'dayjs'
import path from 'path'
import fs from 'fs-extra'
import { Console } from 'console'

import state from '../../../lib/tasks/state'
import util from '../../../lib/util'
import cache from '../../../lib/tasks/cache'

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      stat: vi.fn(),
    },
  }
})

vi.mock('../../../lib/tasks/state', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getCacheDir: vi.fn(),
      getBinaryDir: vi.fn(),
      getPathToExecutable: vi.fn(),
    },
  }
})

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      pkgVersion: vi.fn(),
    },
  }
})

describe('lib/tasks/cache', () => {
  const createStdoutCapture = () => {
    const logs: string[] = []
    // eslint-disable-next-line no-console
    const originalOut = process.stdout.write

    vi.spyOn(process.stdout, 'write').mockImplementation((strOrBugger: string | Uint8Array<ArrayBufferLike>) => {
      logs.push(strOrBugger as string)

      return originalOut(strOrBugger)
    })

    return () => logs.join('')
  }

  // Direct console to process.stdout/stderr
  let originalConsole: Console

  beforeEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()

    originalConsole = globalThis.console
    // Redirect console output to a custom stream or mock
    globalThis.console = new Console(process.stdout, process.stderr)
  })

  afterEach(() => {
    globalThis.console = originalConsole // Restore original console
  })

  beforeEach(async function () {
    mockfs({
      '/.cache/Cypress': {
        '1.2.3': {
          'Cypress': {
            'file1': Buffer.from(new Array(32 * 1024).fill(1)),
            'dir': {
              'file2': Buffer.from(new Array(128 * 1042).fill(2)),
            },
          },
        },
        '2.3.4': {
          'Cypress.app': {},
        },
      },
    })

    // @ts-expect-error mockReturnValue
    state.getCacheDir.mockReturnValue('/.cache/Cypress')
    // @ts-expect-error mockReturnValue
    state.getBinaryDir.mockReturnValue('/.cache/Cypress')
    // @ts-expect-error mockReturnValue
    util.pkgVersion.mockReturnValue('1.2.3')
  })

  afterEach(() => {
    mockfs.restore()
  })

  describe('.path', () => {
    it('lists path to cache', function () {
      const output = createStdoutCapture()

      cache.path()
      const stdout = output()

      expect(stdout).to.eql('/.cache/Cypress\n')
      expect(stdout).toMatchSnapshot()
    })

    it('lists path to cache with silent npm loglevel', function () {
      const output = createStdoutCapture()

      vi.stubEnv('npm_config_loglevel', 'silent')

      cache.path()
      expect(output()).to.eql('/.cache/Cypress\n')
    })

    it('lists path to cache with silent npm warn', function () {
      const output = createStdoutCapture()

      vi.stubEnv('npm_config_loglevel', 'warn')

      cache.path()
      expect(output()).to.eql('/.cache/Cypress\n')
    })
  })

  describe('.clear', () => {
    it('deletes cache folder and everything inside it', async function () {
      const output = createStdoutCapture()

      await cache.clear()

      const exists = await fs.pathExists('/.cache/Cypress')

      expect(exists).toEqual(false)
      expect(output()).toMatchSnapshot()
    })
  })

  describe('.prune', () => {
    it('deletes cache binaries for all version but the current one', async function () {
      const output = createStdoutCapture()

      await cache.prune()

      const checkedInBinaryVersion = util.pkgVersion()

      const files = await fs.readdir('/.cache/Cypress')

      expect(files.length).to.eq(1)

      files.forEach((file: any) => {
        expect(file).to.eq(checkedInBinaryVersion)
      })

      expect(output()).toMatchSnapshot()
    })

    it('doesn\'t delete any cache binaries', async function () {
      const output = createStdoutCapture()

      const dir = path.join(state.getCacheDir(), '2.3.4')

      await fs.remove(dir)

      await cache.prune()

      const checkedInBinaryVersion = util.pkgVersion()

      const files = await fs.readdir('/.cache/Cypress')

      expect(files.length).to.eq(1)

      files.forEach((file: any) => {
        expect(file).to.eq(checkedInBinaryVersion)
      })

      expect(output()).toMatchSnapshot()
    })

    it('exits cleanly if cache dir DNE', async function () {
      const output = createStdoutCapture()

      await fs.remove(state.getCacheDir())
      await cache.prune()

      expect(output()).toMatchSnapshot()
    })
  })

  describe('.list', () => {
    beforeEach(() => {
      // @ts-expect-error mockReturnValue
      state.getPathToExecutable.mockReturnValue('/.cache/Cypress/1.2.3/app/cypress')
    })

    it('lists all versions of cached binary', async function () {
      const output = createStdoutCapture()

      await cache.list()

      expect(output()).toMatchSnapshot()
    })

    it('lists all versions of cached binary with npm log level silent', async function () {
      const output = createStdoutCapture()

      vi.stubEnv('npm_config_loglevel', 'silent')

      await cache.list()
      // log output snapshot should have a grid of versions
      expect(output()).toMatchSnapshot('cache list with silent log level')
    })

    it('lists all versions of cached binary with npm log level warn', async function () {
      const output = createStdoutCapture()

      vi.stubEnv('npm_config_loglevel', 'warn')

      await cache.list()

      // log output snapshot should have a grid of versions
      expect(output()).toMatchSnapshot('cache list with warn log level')
    })

    it('lists all versions of cached binary with last access', async function () {
      const output = createStdoutCapture()

      // @ts-expect-error mockResolvedValueOnce
      fs.stat.mockResolvedValueOnce({
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      // @ts-expect-error mockResolvedValueOnce
      fs.stat.mockResolvedValueOnce({
        atime: dayjs().subtract(5, 'day').valueOf(),
      })

      await cache.list()
      await expect(output()).toMatchSnapshot('list-of-versions')
    })

    it('some versions have never been opened', async function () {
      const output = createStdoutCapture()

      // @ts-expect-error mockResolvedValueOnce
      fs.stat.mockResolvedValueOnce({
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      // the second binary has never been accessed
      // @ts-expect-error mockResolvedValueOnce
      fs.stat.mockResolvedValueOnce()

      await cache.list()
      await expect(output()).toMatchSnapshot('second-binary-never-used')
    })

    it('shows sizes', async function () {
      const output = createStdoutCapture()

      // @ts-expect-error mockResolvedValueOnce
      fs.stat.mockResolvedValueOnce({
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      // the second binary has never been accessed
      // @ts-expect-error mockResolvedValueOnce
      fs.stat.mockResolvedValueOnce()

      await cache.list(true)
      await expect(output()).toMatchSnapshot('show-size')
    })
  })
})
