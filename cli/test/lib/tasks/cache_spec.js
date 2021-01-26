require('../../spec_helper')

const mockfs = require('mock-fs')

const fs = require(`${lib}/fs`)
const state = require(`${lib}/tasks/state`)
const util = require(`${lib}/util`)
const cache = require(`${lib}/tasks/cache`)
const stdout = require('../../support/stdout')
const snapshot = require('../../support/snapshot')
const dayjs = require('dayjs')
const stripAnsi = require('strip-ansi')
const path = require('path')
const termToHtml = require('term-to-html')
const mockedEnv = require('mocked-env')

const outputHtmlFolder = path.join(__dirname, '..', '..', 'html')

describe('lib/tasks/cache', () => {
  beforeEach(() => {
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

    sinon.stub(state, 'getCacheDir').returns('/.cache/Cypress')
    sinon.stub(state, 'getBinaryDir').returns('/.cache/Cypress')
    sinon.stub(util, 'pkgVersion').returns('1.2.3')
    this.stdout = stdout.capture()
  })

  const getSnapshotText = () => {
    this.stdout = this.stdout.toString().split('\n').slice(0, -1).join('\n')
    const stdoutAsString = this.stdout.toString() || '[no output]'

    // first restore the STDOUT, then confirm the value
    // otherwise the error might not even appear or appear twice!
    stdout.restore()

    return stdoutAsString
  }

  const saveHtml = async (filename, html) => {
    await fs.ensureDirAsync(outputHtmlFolder)
    const htmlFilename = path.join(outputHtmlFolder, filename)

    await fs.writeFileAsync(htmlFilename, html, 'utf8')
  }

  afterEach(() => {
    mockfs.restore()
  })

  const defaultSnapshot = (snapshotName) => {
    const stdoutAsString = getSnapshotText()
    const withoutAnsi = stripAnsi(stdoutAsString)

    if (snapshotName) {
      snapshot(snapshotName, withoutAnsi)
    } else {
      snapshot(withoutAnsi)
    }
  }

  const snapshotWithHtml = async (htmlFilename) => {
    const stdoutAsString = getSnapshotText()

    snapshot(stripAnsi(stdoutAsString))

    // if the sanitized snapshot matches, let's save the ANSI colors converted into HTML
    const html = termToHtml.strings(stdoutAsString, termToHtml.themes.dark.name)

    await saveHtml(htmlFilename, html)
  }

  describe('.path', () => {
    let restoreEnv

    afterEach(() => {
      if (restoreEnv) {
        restoreEnv()
        restoreEnv = null
      }
    })

    it('lists path to cache', () => {
      cache.path()
      expect(this.stdout.toString()).to.eql('/.cache/Cypress\n')
      defaultSnapshot()
    })

    it('lists path to cache with silent npm loglevel', () => {
      restoreEnv = mockedEnv({
        npm_config_loglevel: 'silent',
      })

      cache.path()
      expect(this.stdout.toString()).to.eql('/.cache/Cypress\n')
    })

    it('lists path to cache with silent npm warn', () => {
      restoreEnv = mockedEnv({
        npm_config_loglevel: 'warn',
      })

      cache.path()
      expect(this.stdout.toString()).to.eql('/.cache/Cypress\n')
    })
  })

  describe('.clear', () => {
    it('deletes cache folder and everything inside it', () => {
      return cache.clear()
      .then(() => {
        return fs.pathExistsAsync('/.cache/Cypress')
        .then((exists) => {
          expect(exists).to.eql(false)
          defaultSnapshot()
        })
      })
    })
  })

  describe('.prune', () => {
    it('deletes cache binaries for all version but the current one', async () => {
      await cache.prune()

      const currentVersion = util.pkgVersion()

      const files = await fs.readdir('/.cache/Cypress')

      expect(files.length).to.eq(1)

      files.forEach((file) => {
        expect(file).to.eq(currentVersion)
      })

      defaultSnapshot()
    })

    it('doesn\'t delete any cache binaries', async () => {
      const dir = path.join(state.getCacheDir(), '2.3.4')

      await fs.removeAsync(dir)
      await cache.prune()

      const currentVersion = util.pkgVersion()

      const files = await fs.readdirAsync('/.cache/Cypress')

      expect(files.length).to.eq(1)

      files.forEach((file) => {
        expect(file).to.eq(currentVersion)
      })

      defaultSnapshot()
    })

    it('exits cleanly if cache dir DNE', async () => {
      await fs.removeAsync(state.getCacheDir())
      await cache.prune()

      defaultSnapshot()
    })
  })

  describe('.list', () => {
    let restoreEnv

    afterEach(() => {
      if (restoreEnv) {
        restoreEnv()
        restoreEnv = null
      }
    })

    it('lists all versions of cached binary', async function () {
      // unknown access times
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      await cache.list()

      defaultSnapshot()
    })

    it('lists all versions of cached binary with npm log level silent', async function () {
      restoreEnv = mockedEnv({
        npm_config_loglevel: 'silent',
      })

      // unknown access times
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      await cache.list()

      // log output snapshot should have a grid of versions
      defaultSnapshot('cache list with silent log level')
    })

    it('lists all versions of cached binary with npm log level warn', async function () {
      restoreEnv = mockedEnv({
        npm_config_loglevel: 'warn',
      })

      // unknown access times
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      await cache.list()

      // log output snapshot should have a grid of versions
      defaultSnapshot('cache list with warn log level')
    })

    it('lists all versions of cached binary with last access', async function () {
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      const statAsync = sinon.stub(fs, 'statAsync')

      statAsync.onFirstCall().resolves({
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      statAsync.onSecondCall().resolves({
        atime: dayjs().subtract(5, 'day').valueOf(),
      })

      await cache.list()
      await snapshotWithHtml('list-of-versions.html')
    })

    it('some versions have never been opened', async function () {
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      const statAsync = sinon.stub(fs, 'statAsync')

      statAsync.onFirstCall().resolves({
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      // the second binary has never been accessed
      statAsync.onSecondCall().resolves()

      await cache.list()
      await snapshotWithHtml('second-binary-never-used.html')
    })

    it('shows sizes', async function () {
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      const statAsync = sinon.stub(fs, 'statAsync')

      statAsync.onFirstCall().resolves({
        atime: dayjs().subtract(3, 'month').valueOf(),
      })

      // the second binary has never been accessed
      statAsync.onSecondCall().resolves()

      await cache.list(true)
      await snapshotWithHtml('show-size.html')
    })
  })
})
