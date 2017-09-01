require('../spec_helper')

const nock = require('nock')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const snapshot = require('snap-shot-it')

const download = require('../../lib/download/download')
const logger = require('../../lib/logger')
const unzip = require('../../lib/download/unzip')
const downloadUtils = require('../../lib/download/utils')
const util = require('../../lib/util')

describe('download', function () {
  const rootFolder = '/home/user/git'

  beforeEach(function () {
    logger.reset()

    this.options = { displayOpen: false }
    this.sandbox.stub(util, 'exit')
    this.sandbox.stub(util, 'cwd').returns(rootFolder)
    this.sandbox.stub(unzip, 'start').resolves()
    this.sandbox.stub(unzip, 'logErr').resolves()
    this.sandbox.stub(unzip, 'cleanup').resolves()
  })

  it('sets options.version to response x-version', function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => fs.createReadStream('test/fixture/example.zip'))

    nock('https://download.cypress.io')
    .get('/desktop')
    .query(true)
    .reply(302, undefined, {
      'Location': 'https://aws.amazon.com/some.zip',
      'x-version': '0.11.1',
    })

    return download.start(this.options).then(() => {
      expect(this.options.version).to.eq('0.11.1')
    })
  })

  it('can specify cypress version in arguments', function () {
    this.options.version = '0.13.0'
    this.options.cypressVersion = '0.13.0'

    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => fs.createReadStream('test/fixture/example.zip'))

    nock('https://download.cypress.io')
    .get('/desktop/0.13.0')
    .query(true)
    .reply(302, undefined, {
      'Location': 'https://aws.amazon.com/some.zip',
      'x-version': '0.13.0',
    })

    return download.start(this.options).then(() => {
      expect(this.options.version).to.eq('0.13.0')
    })
  })

  it('catches download status errors and exits', function () {
    const err = new Error()
    err.statusCode = 404
    err.statusMessage = 'Not Found'

    // not really the download erroring, but the easiest way to
    // test the error handling
    this.sandbox.stub(downloadUtils, 'ensureInstallationDir').rejects(err)

    return download.start(this.options).then(() => {
      expect(util.exit).to.be.calledWith(1)
    })
  })

  it('catches unzip errors, logs them, and exits', function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => fs.createReadStream('test/fixture/example.zip'))

    nock('https://download.cypress.io')
    .get('/desktop')
    .query(true)
    .reply(302, undefined, {
      'Location': 'https://aws.amazon.com/some.zip',
      'x-version': '0.11.1',
    })

    let err = new Error('unzip failed')
    unzip.start.rejects(err)

    return download.start(this.options).then(() => {
      expect(unzip.logErr).to.be.calledWithMatch(err)
      expect(util.exit).to.be.calledWith(1)
    })
  })

  describe('when finished', function () {
    beforeEach(function () {
      this.options = { initialize: false, version: '0.11.1' }

      nock('https://aws.amazon.com')
      .get('/some.zip')
      .reply(200, () => fs.createReadStream('test/fixture/example.zip'))

      nock('https://download.cypress.io')
      .get('/desktop')
      .query(true)
      .reply(302, undefined, {
        'Location': 'https://aws.amazon.com/some.zip',
        'x-version': '0.11.1',
      })
    })

    it('cleans up zip', function () {
      return download.start(this.options)
      .then(() => {
        expect(unzip.cleanup).to.be.calledWith(this.options)
      })
    })

    it('logs out Finished Installing', function () {
      this.sandbox.stub(downloadUtils, 'getPathToUserExecutable').returns('/foo/bar')

      return download.start(this.options)
      .then(() => {
        snapshot(logger.print())
      })
    })

    it('the reported path is relative', function () {
      const appAt = 'node_modules/cypress/dist/Cypress.app'
      this.sandbox.stub(downloadUtils, 'getPathToUserExecutable')
        .returns(path.join(rootFolder, appAt))

      return download.start(this.options)
      .then(() => {
        snapshot(logger.print())
      })
    })

    it.skip('displays opening app message', function () {
      return download.start(this.options)
      .then(() => {
        snapshot(logger.print())
      })
    })

    it.skip('can silence opening app message', function () {
      this.options.displayOpen = false

      return download.start(this.options)
      .then(() => {
        snapshot(logger.print())
      })
    })
  })
})
