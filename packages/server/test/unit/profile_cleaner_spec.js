require('../spec_helper')

const os = require('os')
const path = require('path')
const fs = require(`${root}/lib/util/fs`)
const findProcess = require(`${root}lib/util/find_process`)
const profileCleaner = require(`${root}lib/util/profile_cleaner`)

const tmpDir = os.tmpdir()
const pidProfilesFolder = path.join(tmpDir, 'pid-profiles')

describe('lib/util/profile_cleaner', () => {
  context('.isCypressProcess', () => {
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

  context('.removeInactiveByPid', () => {
    beforeEach(() => {
      sinon.stub(findProcess, 'byPid')
      .withArgs(53301)
      .resolves([
        {
          pid: '53301',
          ppid: '53300',
          uid: '501',
          gid: '20',
          name: 'Cypress',
          cmd: '/Users/bmann/Library/Caches/Cypress/3.0.3/Cypress.app/Contents/MacOS/Cypress --project /Users/bmann/Dev/cypress-dashboard --cwd /Users/bmann/Dev/cypress-dashboard',
        },
      ])
      .withArgs(12345)
      .resolves([
        {
          pid: '12345',
          name: 'Foo',
          cmd: 'node foo bar',
        },
      ])
      .withArgs(9999)
      .resolves([])

      const createFolder = (folder) => {
        return fs.ensureDirAsync(path.join(pidProfilesFolder, folder))
      }

      return Promise.all([
        createFolder('run-9999'),
        createFolder('run-12345'),
        createFolder('run-53301'),
        createFolder('foo-53301'),
      ])
    })

    afterEach(() => {
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
      }).finally(() => {
        return findProcess.byPid.restore()
      })
    })
  })
})
