import '../../spec_helper'
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
        expect(profileCleaner.isCypressProcess(obj), JSON.stringify(obj)).to.eq(bool)
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
      sinon.stub(findProcess, 'byPid')
      .withArgs(53301)
      .resolves([
        {
          pid: 53301,
          ppid: 53300,
          uid: 501,
          gid: 20,
          name: 'Cypress',
          cmd: '/Users/bmann/Library/Caches/Cypress/3.0.3/Cypress.app/Contents/MacOS/Cypress --project /Users/bmann/Dev/cypress-dashboard --cwd /Users/bmann/Dev/cypress-dashboard',
        },
      ])
      .withArgs(12345)
      .resolves([
        {
          pid: 12345,
          name: 'Foo',
          cmd: 'node foo bar',
        },
      ])
      .withArgs(9999)
      .resolves([])

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
      sinon.restore()

      return fs.removeAsync(pidProfilesFolder)
    })

    it('removes profiles which are not cypress pids', () => {
      const expected = function (folder, condition) {
        const pathToFolder = path.join(pidProfilesFolder, folder)

        return fs
        .pathExists(pathToFolder)
        .then((bool) => {
          expect(bool, `expected folder: ${pathToFolder} to exist? ${condition}`).to.eq(condition)
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
        expect(result).to.eql([])
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
      .then(() => Promise.all([
        fs.pathExists(fileA),
        fs.pathExists(fileB),
      ]))
      .then(([existsA, existsB]) => {
        expect(existsA).to.eq(false)
        expect(existsB).to.eq(false)
      })
    })

    it('swallows errors when glob throws', () => {
      sinon.stub(globModule, 'globAsync').rejects(new Error('glob error'))

      return profileCleaner.removeRootProfile(rootProfileFolder)
      .then((result) => {
        expect(result).to.be.undefined
      })
      .finally(() => sinon.restore())
    })
  })
})
