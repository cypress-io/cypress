import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import chalk from 'chalk'
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

    const originalOut = process.stdout.write

    vi.spyOn(process.stdout, 'write').mockImplementation((strOrBugger: string | Uint8Array<ArrayBufferLike>) => {
      logs.push(strOrBugger as string)

      return originalOut(strOrBugger)
    })

    return () => logs.join('')
  }

  // Direct console to process.stdout/stderr
  let originalConsole: Console
  let previousChalkLevel: 0 | 1 | 2 | 3

  beforeEach(() => {
    previousChalkLevel = chalk.level
    chalk.level = 3
    vi.resetAllMocks()
    vi.unstubAllEnvs()

    originalConsole = globalThis.console
    // Redirect console output to a custom stream or mock
    globalThis.console = new Console(process.stdout, process.stderr)
  })

  afterEach(() => {
    globalThis.console = originalConsole // Restore original console
    chalk.level = previousChalkLevel
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

    vi.mocked(state.getCacheDir).mockReturnValue('/.cache/Cypress')
    vi.mocked(state.getBinaryDir).mockReturnValue('/.cache/Cypress')
    vi.mocked(util.pkgVersion).mockReturnValue('1.2.3')
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

    it('removes the bundles/ subdir alongside binary version dirs', async function () {
      mockfs.restore()
      mockfs({
        '/.cache/Cypress': {
          '1.2.3': { 'Cypress': { 'file1': 'binary' } },
          'bundles': {
            'cy-prompt': {
              'abc123': {
                'manifest.json': '{}',
                'server': { 'index.js': '// ...' },
              },
            },
            'studio': {
              'def456': {
                'manifest.json': '{}',
              },
            },
          },
        },
      })

      vi.mocked(state.getCacheDir).mockReturnValue('/.cache/Cypress')

      await cache.clear()

      expect(await fs.pathExists('/.cache/Cypress')).toEqual(false)
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

    it('preserves the bundles/ subdir while pruning old binary versions', async function () {
      mockfs.restore()
      mockfs({
        '/.cache/Cypress': {
          '1.2.3': { 'Cypress': { 'file1': 'current' } },
          '2.3.4': { 'Cypress.app': {} },
          'bundles': {
            'cy-prompt': {
              'abc123': {
                'manifest.json': '{}',
                'server': { 'index.js': '// hi' },
              },
            },
            'studio': {
              'def456': {
                'manifest.json': '{}',
              },
            },
          },
        },
      })

      vi.mocked(state.getCacheDir).mockReturnValue('/.cache/Cypress')
      vi.mocked(util.pkgVersion).mockReturnValue('1.2.3')

      await cache.prune()

      // Old binary version is removed, current one and bundles/ survive
      expect(await fs.pathExists('/.cache/Cypress/2.3.4')).toEqual(false)
      expect(await fs.pathExists('/.cache/Cypress/1.2.3')).toEqual(true)
      expect(await fs.pathExists('/.cache/Cypress/bundles/cy-prompt/abc123/manifest.json')).toEqual(true)
      expect(await fs.pathExists('/.cache/Cypress/bundles/studio/def456/manifest.json')).toEqual(true)
    })

    it('prunes beta/prerelease binary dirs produced by getVersionDir()', async function () {
      // state.getVersionDir() formats non-stable builds as
      // `beta-<version>-<branch>-<sha>`, which is not a valid semver. These
      // must still be pruned alongside other non-current binary versions.
      mockfs.restore()
      mockfs({
        '/.cache/Cypress': {
          '1.2.3': { 'Cypress': { 'file1': 'current' } },
          'beta-15.0.0-feat-abc12345': { 'Cypress.app': {} },
          'beta-14.5.0-fix-deadbeef': { 'Cypress.app': {} },
          'bundles': {
            'cy-prompt': { 'abc123': { 'manifest.json': '{}' } },
          },
        },
      })

      vi.mocked(state.getCacheDir).mockReturnValue('/.cache/Cypress')
      vi.mocked(util.pkgVersion).mockReturnValue('1.2.3')

      await cache.prune()

      // Beta dirs are pruned; current binary and bundles/ survive
      expect(await fs.pathExists('/.cache/Cypress/beta-15.0.0-feat-abc12345')).toEqual(false)
      expect(await fs.pathExists('/.cache/Cypress/beta-14.5.0-fix-deadbeef')).toEqual(false)
      expect(await fs.pathExists('/.cache/Cypress/1.2.3')).toEqual(true)
      expect(await fs.pathExists('/.cache/Cypress/bundles/cy-prompt/abc123/manifest.json')).toEqual(true)
    })
  })

  describe('.list', () => {
    beforeEach(() => {
      vi.mocked(state.getPathToExecutable).mockReturnValue('/.cache/Cypress/1.2.3/app/cypress')
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

      vi.mocked(fs.stat).mockResolvedValueOnce({
        // @ts-expect-error mock arguments
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      vi.mocked(fs.stat).mockResolvedValueOnce({
        // @ts-expect-error mock arguments
        atime: dayjs().subtract(5, 'day').valueOf(),
      })

      await cache.list()
      await expect(output()).toMatchSnapshot('list-of-versions')
    })

    it('some versions have never been opened', async function () {
      const output = createStdoutCapture()

      vi.mocked(fs.stat).mockResolvedValueOnce({
        // @ts-expect-error mock arguments
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      // the second binary has never been accessed
      vi.mocked(fs.stat).mockResolvedValueOnce(undefined)

      await cache.list()
      await expect(output()).toMatchSnapshot('second-binary-never-used')
    })

    it('shows sizes', async function () {
      const output = createStdoutCapture()

      vi.mocked(fs.stat).mockResolvedValueOnce({
        // @ts-expect-error mock arguments
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      // the second binary has never been accessed
      vi.mocked(fs.stat).mockResolvedValueOnce(undefined)

      await cache.list(true)
      await expect(output()).toMatchSnapshot('show-size')
    })
  })
})
