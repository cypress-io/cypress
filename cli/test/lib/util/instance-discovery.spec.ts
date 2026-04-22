import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import mockfs from 'mock-fs'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  InstanceDiscoveryError,
  readInstances,
  resolveInstance,
  runningDir,
} from '../../../lib/util/instance-discovery'

/**
 * Helper: build a mock-fs layout for a given CYPRESS_INTERNAL_ENV ("production" by
 * default here) under the darwin user data dir. Tests that exercise other
 * platforms stub `process.platform` themselves.
 */
const DARWIN_HOME = '/Users/tester'
const RUNNING_DIR_DARWIN = path.join(
  DARWIN_HOME,
  'Library',
  'Application Support',
  'Cypress',
  'cy',
  'production',
  'running',
)

const makeDescriptor = (overrides: Record<string, any> = {}) => {
  return JSON.stringify({
    pid: 54321,
    port: 58931,
    token: 'a'.repeat(64),
    projectRoot: '/Users/me/code/my-app',
    projectHash: 'abcdef0123456789',
    cypressVersion: '15.0.0',
    startedAt: '2026-04-22T15:40:12.000Z',
    ...overrides,
  })
}

describe('lib/util/instance-discovery', () => {
  let killSpy: any
  let stderrSpy: any
  let platformSpy: any = null
  let homedirSpy: any = null

  beforeEach(() => {
    // Default: treat every pid as alive (test cases override as needed).
    killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true as any)

    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

    // Pin platform + home dir so `runningDir()` is deterministic.
    platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin')
    homedirSpy = vi.spyOn(os, 'homedir').mockReturnValue(DARWIN_HOME)

    vi.unstubAllEnvs()
    vi.stubEnv('CYPRESS_INTERNAL_ENV', 'production')
  })

  afterEach(() => {
    mockfs.restore()
    killSpy.mockRestore()
    stderrSpy.mockRestore()
    platformSpy?.mockRestore()
    homedirSpy?.mockRestore()
  })

  describe('runningDir()', () => {
    it('returns darwin path shape', () => {
      platformSpy?.mockReturnValue('darwin')
      homedirSpy?.mockReturnValue('/Users/foo')

      expect(runningDir()).to.eql(
        '/Users/foo/Library/Application Support/Cypress/cy/production/running',
      )
    })

    it('returns linux path shape', () => {
      platformSpy?.mockReturnValue('linux')
      homedirSpy?.mockReturnValue('/home/foo')

      expect(runningDir()).to.eql('/home/foo/.config/Cypress/cy/production/running')
    })

    it('returns win32 path shape using APPDATA', () => {
      platformSpy?.mockReturnValue('win32')
      vi.stubEnv('APPDATA', 'C:\\Users\\foo\\AppData\\Roaming')

      const expected = path.join(
        'C:\\Users\\foo\\AppData\\Roaming',
        'Cypress',
        'cy',
        'production',
        'running',
      )

      expect(runningDir()).to.eql(expected)
    })

    it('honours CYPRESS_INTERNAL_ENV', () => {
      vi.stubEnv('CYPRESS_INTERNAL_ENV', 'development')
      expect(runningDir()).to.contain(path.join('cy', 'development', 'running'))
    })

    it('falls back to home on win32 when APPDATA is unset', () => {
      platformSpy?.mockReturnValue('win32')
      // NOTE: vi.stubEnv can't unset — use delete on process.env directly.
      delete process.env.APPDATA
      homedirSpy?.mockReturnValue('C:\\Users\\foo')

      expect(runningDir()).to.contain(path.join('AppData', 'Roaming', 'Cypress'))
    })
  })

  describe('readInstances()', () => {
    it('returns [] when runningDir does not exist', async () => {
      mockfs({
        // Create the user data dir but not the running subdir.
        [path.join(DARWIN_HOME, 'Library', 'Application Support', 'Cypress')]: {},
      })

      const result = await readInstances()

      expect(result).to.eql([])
    })

    it('returns [] for an empty running dir', async () => {
      mockfs({
        [RUNNING_DIR_DARWIN]: {},
      })

      const result = await readInstances()

      expect(result).to.eql([])
    })

    it('returns a single valid descriptor and preserves the file', async () => {
      mockfs({
        [RUNNING_DIR_DARWIN]: {
          '54321.json': makeDescriptor(),
        },
      })

      const result = await readInstances()

      expect(result).to.have.length(1)
      expect(result[0].pid).to.eql(54321)
      expect(result[0].descriptorPath).to.eql(path.join(RUNNING_DIR_DARWIN, '54321.json'))
      // File should still exist.
      expect(fs.existsSync(result[0].descriptorPath)).to.eql(true)
    })

    it('prunes descriptors whose pid is dead (ESRCH) and deletes the file', async () => {
      mockfs({
        [RUNNING_DIR_DARWIN]: {
          '54321.json': makeDescriptor({ pid: 54321 }),
        },
      })

      killSpy.mockImplementation(() => {
        const err: NodeJS.ErrnoException = new Error('ESRCH') as any

        err.code = 'ESRCH'
        throw err
      })

      const result = await readInstances()

      expect(result).to.eql([])
      expect(fs.existsSync(path.join(RUNNING_DIR_DARWIN, '54321.json'))).to.eql(false)
    })

    it('includes descriptors whose pid is EPERM (alive but unsignalable)', async () => {
      mockfs({
        [RUNNING_DIR_DARWIN]: {
          '54321.json': makeDescriptor({ pid: 54321 }),
        },
      })

      killSpy.mockImplementation(() => {
        const err: NodeJS.ErrnoException = new Error('EPERM') as any

        err.code = 'EPERM'
        throw err
      })

      const result = await readInstances()

      expect(result).to.have.length(1)
      expect(result[0].pid).to.eql(54321)
      expect(fs.existsSync(result[0].descriptorPath)).to.eql(true)
    })

    it('skips malformed JSON, warns on stderr, and preserves the file', async () => {
      const bad = path.join(RUNNING_DIR_DARWIN, '1.json')

      mockfs({
        [RUNNING_DIR_DARWIN]: {
          '1.json': '{not valid json',
        },
      })

      const result = await readInstances()

      expect(result).to.eql([])
      expect(stderrSpy).toHaveBeenCalled()
      const msg = (stderrSpy.mock.calls[0][0] as string) || ''

      expect(msg).to.match(/failed to parse/)
      // Malformed descriptors are NOT auto-pruned — could be a future-format file.
      expect(fs.existsSync(bad)).to.eql(true)
    })

    it('skips descriptors missing required pid and preserves the file', async () => {
      const bad = path.join(RUNNING_DIR_DARWIN, 'bad.json')

      mockfs({
        [RUNNING_DIR_DARWIN]: {
          'bad.json': JSON.stringify({ port: 58931, token: 'x'.repeat(64) }),
        },
      })

      const result = await readInstances()

      expect(result).to.eql([])
      expect(fs.existsSync(bad)).to.eql(true)
    })

    it('returns multiple live instances sorted by startedAt ascending', async () => {
      mockfs({
        [RUNNING_DIR_DARWIN]: {
          '1.json': makeDescriptor({
            pid: 1,
            projectRoot: '/Users/me/code/a',
            startedAt: '2026-04-22T15:40:12.000Z',
          }),
          '2.json': makeDescriptor({
            pid: 2,
            projectRoot: '/Users/me/code/b',
            startedAt: '2026-04-22T15:30:00.000Z',
          }),
          '3.json': makeDescriptor({
            pid: 3,
            projectRoot: '/Users/me/code/c',
            startedAt: '2026-04-22T15:50:00.000Z',
          }),
        },
      })

      const result = await readInstances()

      expect(result.map((i) => i.pid)).to.eql([2, 1, 3])
    })

    it('ignores non-.json entries in runningDir', async () => {
      mockfs({
        [RUNNING_DIR_DARWIN]: {
          'README.txt': 'hi',
          '54321.json': makeDescriptor(),
        },
      })

      const result = await readInstances()

      expect(result).to.have.length(1)
    })
  })

  describe('resolveInstance()', () => {
    const setupRunning = (files: Record<string, string>) => {
      mockfs({
        [RUNNING_DIR_DARWIN]: files,
      })
    }

    it('throws NO_INSTANCE with no arg and zero instances', async () => {
      setupRunning({})

      await expect(resolveInstance()).rejects.toSatisfy((err: unknown) => {
        return err instanceof InstanceDiscoveryError && err.code === 'NO_INSTANCE'
      })
    })

    it('returns the only instance with no arg', async () => {
      setupRunning({
        '54321.json': makeDescriptor({ pid: 54321 }),
      })

      const inst = await resolveInstance()

      expect(inst.pid).to.eql(54321)
    })

    it('throws AMBIGUOUS_INSTANCE with no arg and multiple instances', async () => {
      setupRunning({
        '1.json': makeDescriptor({ pid: 1, startedAt: '2026-04-22T15:40:12.000Z' }),
        '2.json': makeDescriptor({ pid: 2, startedAt: '2026-04-22T15:41:12.000Z' }),
      })

      try {
        await resolveInstance()
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(InstanceDiscoveryError)
        const ide = err as InstanceDiscoveryError

        expect(ide.code).to.eql('AMBIGUOUS_INSTANCE')
        expect(ide.instances).to.have.length(2)
        expect(ide.instances!.map((i) => i.pid).sort()).to.eql([1, 2])
      }
    })

    it('matches by numeric pid string', async () => {
      setupRunning({
        '1.json': makeDescriptor({ pid: 1, projectRoot: '/a' }),
        '54321.json': makeDescriptor({ pid: 54321, projectRoot: '/b' }),
      })

      const inst = await resolveInstance('54321')

      expect(inst.pid).to.eql(54321)
    })

    it('throws NO_INSTANCE when numeric pid matches nothing', async () => {
      setupRunning({
        '1.json': makeDescriptor({ pid: 1 }),
      })

      try {
        await resolveInstance('99999')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(InstanceDiscoveryError)
        expect((err as InstanceDiscoveryError).code).to.eql('NO_INSTANCE')
      }
    })

    it('matches by exact projectRoot', async () => {
      setupRunning({
        '1.json': makeDescriptor({ pid: 1, projectRoot: '/Users/me/proj' }),
        '2.json': makeDescriptor({ pid: 2, projectRoot: '/Users/me/other' }),
      })

      const inst = await resolveInstance('/Users/me/proj')

      expect(inst.pid).to.eql(1)
    })

    it('matches by unique substring in projectRoot', async () => {
      setupRunning({
        '1.json': makeDescriptor({ pid: 1, projectRoot: '/Users/me/my-proj' }),
        '2.json': makeDescriptor({ pid: 2, projectRoot: '/Users/me/other-app' }),
      })

      const inst = await resolveInstance('proj')

      expect(inst.pid).to.eql(1)
    })

    it('throws AMBIGUOUS_INSTANCE when substring matches multiple', async () => {
      setupRunning({
        '1.json': makeDescriptor({
          pid: 1,
          projectRoot: '/Users/me/proj-one',
          startedAt: '2026-04-22T15:40:12.000Z',
        }),
        '2.json': makeDescriptor({
          pid: 2,
          projectRoot: '/Users/me/proj-two',
          startedAt: '2026-04-22T15:41:12.000Z',
        }),
      })

      try {
        await resolveInstance('proj')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(InstanceDiscoveryError)
        const ide = err as InstanceDiscoveryError

        expect(ide.code).to.eql('AMBIGUOUS_INSTANCE')
        expect(ide.instances).to.have.length(2)
      }
    })

    it('prefers exact match over endsWith/substring when selectors could match both', async () => {
      setupRunning({
        '1.json': makeDescriptor({ pid: 1, projectRoot: 'proj' }),
        '2.json': makeDescriptor({ pid: 2, projectRoot: '/Users/me/proj-extra' }),
      })

      const inst = await resolveInstance('proj')

      expect(inst.pid).to.eql(1)
    })

    it('uses endsWith tier when no exact match but exactly one suffix match', async () => {
      setupRunning({
        '1.json': makeDescriptor({ pid: 1, projectRoot: '/Users/me/my-app' }),
        '2.json': makeDescriptor({ pid: 2, projectRoot: '/Users/me/other' }),
      })

      const inst = await resolveInstance('my-app')

      expect(inst.pid).to.eql(1)
    })

    it('throws AMBIGUOUS_INSTANCE when endsWith tier matches multiple', async () => {
      setupRunning({
        '1.json': makeDescriptor({
          pid: 1,
          projectRoot: '/Users/a/my-app',
          startedAt: '2026-04-22T15:40:12.000Z',
        }),
        '2.json': makeDescriptor({
          pid: 2,
          projectRoot: '/Users/b/my-app',
          startedAt: '2026-04-22T15:41:12.000Z',
        }),
      })

      try {
        await resolveInstance('my-app')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(InstanceDiscoveryError)
        expect((err as InstanceDiscoveryError).code).to.eql('AMBIGUOUS_INSTANCE')
      }
    })

    it('throws NO_INSTANCE when no tier matches', async () => {
      setupRunning({
        '1.json': makeDescriptor({ pid: 1, projectRoot: '/a' }),
      })

      try {
        await resolveInstance('nowhere')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(InstanceDiscoveryError)
        expect((err as InstanceDiscoveryError).code).to.eql('NO_INSTANCE')
      }
    })
  })
})
