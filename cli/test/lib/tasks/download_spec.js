require('../../spec_helper')

const os = require('os')
const nock = require('nock')
const snapshot = require('snap-shot-it')

const fs = require(`${lib}/fs`)
const logger = require(`${lib}/logger`)
const util = require(`${lib}/util`)
const info = require(`${lib}/tasks/info`)
const download = require(`${lib}/tasks/download`)

const stdout = require('../../support/stdout')

describe('download', function () {
  const rootFolder = '/home/user/git'

  beforeEach(function () {
    logger.reset()

    this.stdout = stdout.capture()

    this.options = { displayOpen: false }

    this.sandbox.stub(os, 'platform').returns('darwin')
    this.sandbox.stub(os, 'release').returns('test release')
    this.sandbox.stub(util, 'pkgVersion').returns('1.2.3')
    this.sandbox.stub(util, 'cwd').returns(rootFolder)
  })

  afterEach(function () {
    stdout.restore()
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
    const ctx = this

    const err = new Error()
    err.statusCode = 404
    err.statusMessage = 'Not Found'

    // not really the download erroring, but the easiest way to
    // test the error handling
    this.sandbox.stub(info, 'ensureInstallationDir').rejects(err)

    return download.start(this.options)
    .then(() => {
      throw new Error('should have caught')
    })
    .catch((err) => {
      logger.error(err)

      snapshot('download status errors', util.normalize(ctx.stdout.toString()))
    })
  })
})
