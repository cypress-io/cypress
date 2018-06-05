require('../../spec_helper')

const mockfs = require('mock-fs')

const fs = require(`${lib}/fs`)
const state = require(`${lib}/tasks/state`)
const cache = require(`${lib}/tasks/cache`)
const stdout = require('../../support/stdout')

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
    this.stdout = stdout.capture()
  })

  afterEach(() => {
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
      .then(() =>
        fs.pathExistsAsync('/.cache/Cypress')
        .then((exists) => expect(exists).to.eql(false))
      )
    })
  })
  describe('.list', () => {
    it('lists all versions of cached binary', () => {
      return cache.list()
      .then(() => {
        expect(this.stdout.toString()).to.eql('1.2.3, 2.3.4\n')
      })
    })
  })
})
