import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import os from 'os'
import path from 'path'
import { fs } from '../../../lib/util/fs'
import * as findProcess from '../../../lib/util/find_process'
import * as globModule from '../../../lib/util/glob'
import * as profileCleaner from '../../../lib/util/profile_cleaner'

const tmpDir = os.tmpdir()
const pidProfilesFolder = path.join(tmpDir, 'pid-profiles')
const rootProfileFolder = path.join(tmpDir, 'root-profile-cleaner')

describe('lib/util/profile_cleaner', () => {
  describe('.isCypressProcess', () => {
    it('finds cypress processes by name or cmd', () => {
      const isProc = (obj, bool) => {
        expect(profileCleaner.isCypressProcess(obj), JSON.stringify(obj)).toBe(bool)
      }

      const processes = [
        {
          name: 'CYPRESS',
        },
        {
          cmd: 'path/to/Cypress -- some args',
        },
        {
          name: 'nope',
          cmd: 'not found',
        },
      ]

      isProc(processes[0], true)
      isProc(processes[1], true)

      return isProc(processes[2], false)
    })
  })

  describe('.removeInactiveByPid', () => {
    beforeEach(() => {
      const processesByPid = {
        53301: [
          {
            pid: 53301,
            ppid: 53300,
            uid: 501,
            gid: 20,
            name: 'Cypress',
            cmd: '/Users/bmann/Library/Caches/Cypress/3.0.3/Cypress.app/Contents/MacOS/Cypress --project /Users/bmann/Dev/cypress-dashboard --cwd /Users/bmann/Dev/cypress-dashboard',
          },
        ],
        12345: [
          {
            pid: 12345,
            name: 'Foo',
            cmd: 'node foo bar',
          },
        ],
        9999: [],
      }

      vi.spyOn(findProcess, 'byPid').mockImplementation((pid) => {
        return pid in processesByPid ? Promise.resolve(processesByPid[pid]) : undefined as any
      })

      const createFolder = (folder) => {
        return fs.ensureDir(path.join(pidProfilesFolder, folder))
      }

      return Promise.all([
        createFolder('run-9999'),
        createFolder('run-12345'),
        createFolder('run-53301'),
        createFolder('foo-53301'),
      ])
    })

    afterEach(() => {
      vi.restoreAllMocks()

      return fs.removeAsync(pidProfilesFolder)
    })

    it('removes profiles which are not cypress pids', () => {
      const expected = function (folder, condition) {
        const pathToFolder = path.join(pidProfilesFolder, folder)

        return fs
        .pathExists(pathToFolder)
        .then((bool) => {
          expect(bool, `expected folder: ${pathToFolder} to exist? ${condition}`).toBe(condition)
        })
      }

      return profileCleaner.removeInactiveByPid(pidProfilesFolder, 'run-')
      .then(() => {
        return Promise.all([
          expected('run-9999', false),
          expected('run-12345', false),
          expected('run-53301', true),
          expected('foo-53301', true),
        ])
      })
    })

    it('resolves when no profile folders match the prefix', () => {
      const emptyFolder = path.join(tmpDir, 'empty-pid-profiles')

      return fs.ensureDir(emptyFolder)
      .then(() => profileCleaner.removeInactiveByPid(emptyFolder, 'run-'))
      .then((result) => {
        expect(result).toStrictEqual([])
      })
      .finally(() => fs.removeAsync(emptyFolder))
    })
  })

  describe('.removeRootProfile', () => {
    beforeEach(() => {
      return fs.ensureDir(rootProfileFolder)
    })

    afterEach(() => {
      return fs.removeAsync(rootProfileFolder).catch(() => {})
    })

    it('removes all matches in the profile directory', () => {
      const fileA = path.join(rootProfileFolder, 'a')
      const fileB = path.join(rootProfileFolder, 'b')

      return fs.writeFileAsync(fileA, '')
      .then(() => fs.writeFileAsync(fileB, ''))
      .then(() => profileCleaner.removeRootProfile(rootProfileFolder))
      .then(() => {
        return Promise.all([
          fs.pathExists(fileA),
          fs.pathExists(fileB),
        ])
      })
      .then(([existsA, existsB]) => {
        expect(existsA).toBe(false)
        expect(existsB).toBe(false)
      })
    })

    it('swallows errors when glob throws', () => {
      vi.spyOn(globModule, 'globAsync').mockRejectedValue(new Error('glob error'))

      return profileCleaner.removeRootProfile(rootProfileFolder)
      .then((result) => {
        expect(result).toBeUndefined()
      })
      .finally(() => vi.restoreAllMocks())
    })
  })
})
