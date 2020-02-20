require('../../spec_helper')

const mockfs = require('mock-fs')

const fs = require(`${lib}/fs`)
const state = require(`${lib}/tasks/state`)
const cache = require(`${lib}/tasks/cache`)
const stdout = require('../../support/stdout')
const snapshot = require('../../support/snapshot')
const moment = require('moment')
const stripAnsi = require('strip-ansi')

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

  afterEach(() => {
    mockfs.restore()
    this.stdout = this.stdout.toString().split('\n').slice(0, -2).join('\n')
    const stdoutAsString = this.stdout.toString() || '[no output]'

    snapshot(stripAnsi(stdoutAsString))
    stdout.restore()
  })

  describe('.path', () => {
    it('lists path to cache', () => {
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
          return expect(exists).to.eql(false)
        })
      })
    })
  })

  describe('.list', () => {
    it('lists all versions of cached binary', () => {
      // unknown access times
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      return cache.list()
    })

    it('lists all versions of cached binary with last access', () => {
      sinon.stub(state, 'getPathToExecutable').returns('/.cache/Cypress/1.2.3/app/cypress')

      const statAsync = sinon.stub(fs, 'statAsync')

      statAsync.onFirstCall().resolves({
        atime: moment().subtract(3, 'month').valueOf(),
      })

      statAsync.onSecondCall().resolves({
        atime: moment().subtract(5, 'day').valueOf(),
      })

      return cache.list()
    })
  })
})
