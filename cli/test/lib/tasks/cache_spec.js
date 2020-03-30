require('../../spec_helper')

const mockfs = require('mock-fs')

const fs = require(`${lib}/fs`)
const state = require(`${lib}/tasks/state`)
const cache = require(`${lib}/tasks/cache`)
const stdout = require('../../support/stdout')
const snapshot = require('../../support/snapshot')
const moment = require('moment')
const stripAnsi = require('strip-ansi')
const path = require('path')
const termToHtml = require('term-to-html')

const outputHtmlFolder = path.join(__dirname, '..', '..', 'html')

describe('lib/tasks/cache', () => {
  beforeEach(() => {
    mockfs({
      '/.cache/Cypress': {
        '1.2.3': {
          'Cypress': {},
        },
        '2.3.4': {
          'Cypress.app': {},
        },
      },
    })

    sinon.stub(state, 'getCacheDir').returns('/.cache/Cypress')
    sinon.stub(state, 'getBinaryDir').returns('/.cache/Cypress')
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

  const defaultSnapshot = () => {
    const stdoutAsString = getSnapshotText()

    snapshot(stripAnsi(stdoutAsString))
  }

  const snapshotWithHtml = async (htmlFilename) => {
    const stdoutAsString = getSnapshotText()

    snapshot(stripAnsi(stdoutAsString))

    // if the sanitized snapshot matches, let's save the ANSI colors converted into HTML
    const html = termToHtml.strings(stdoutAsString, termToHtml.themes.dark.name)

    await saveHtml(htmlFilename, html)
  }

  describe('.path', () => {
    it('lists path to cache', () => {
      cache.path()
      expect(this.stdout.toString()).to.eql('/.cache/Cypress\n')
      defaultSnapshot()
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

  describe('.list', () => {
    it('lists all versions of cached binary', async function () {
      // unknown access times
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      await cache.list()

      defaultSnapshot()
    })

    it('lists all versions of cached binary with last access', async function () {
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      const statAsync = sinon.stub(fs, 'statAsync')

      statAsync.onFirstCall().resolves({
        atime: moment().subtract(3, 'month').valueOf(),
      })

      statAsync.onSecondCall().resolves({
        atime: moment().subtract(5, 'day').valueOf(),
      })

      await cache.list()
      await snapshotWithHtml('list-of-versions.html')
    })

    it('some versions have never been opened', async function () {
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      const statAsync = sinon.stub(fs, 'statAsync')

      statAsync.onFirstCall().resolves({
        atime: moment().subtract(3, 'month').valueOf(),
      })

      // the second binary has never been accessed
      statAsync.onSecondCall().resolves()

      await cache.list()
      await snapshotWithHtml('second-binary-never-used.html')
    })
  })
})
