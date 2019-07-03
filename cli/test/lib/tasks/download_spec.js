require('../../spec_helper')

const os = require('os')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const nock = require('nock')
const snapshot = require('../../support/snapshot')

const fs = require(`${lib}/fs`)
const logger = require(`${lib}/logger`)
const util = require(`${lib}/util`)
const download = require(`${lib}/tasks/download`)

const stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')

const downloadDestination = path.join(os.tmpdir(), 'Cypress', 'download', 'cypress.zip')
const version = '1.2.3'

describe('lib/tasks/download', function () {
  require('mocha-banner').register()

  const rootFolder = '/home/user/git'

  beforeEach(function () {
    logger.reset()

    this.stdout = stdout.capture()

    this.options = {
      downloadDestination,
      version,
    }

    os.platform.returns('darwin')
    sinon.stub(util, 'pkgVersion').returns('1.2.3')
    sinon.stub(util, 'cwd').returns(rootFolder)
  })

  afterEach(function () {
    stdout.restore()
  })

  context('download url', () => {
    it('returns url', () => {
      const url = download.getUrl()

      la(is.url(url), url)
    })

    it('returns latest desktop url', () => {
      const url = download.getUrl()

      snapshot('latest desktop url 1', normalize(url))
    })

    it('returns specific desktop version url', () => {
      const url = download.getUrl('0.20.2')

      snapshot('specific version desktop url 1', normalize(url))
    })

    it('returns input if it is already an https link', () => {
      const url = 'https://somewhere.com'
      const result = download.getUrl(url)

      expect(result).to.equal(url)
    })

    it('returns input if it is already an http link', () => {
      const url = 'http://local.com'
      const result = download.getUrl(url)

      expect(result).to.equal(url)
    })
  })

  context('download base url from CYPRESS_DOWNLOAD_MIRROR env var', () => {
    it('env var', () => {
      process.env.CYPRESS_DOWNLOAD_MIRROR = 'https://cypress.example.com'
      const url = download.getUrl('0.20.2')

      snapshot('base url from CYPRESS_DOWNLOAD_MIRROR 1', normalize(url))
    })

    it('env var with trailing slash', () => {
      process.env.CYPRESS_DOWNLOAD_MIRROR = 'https://cypress.example.com/'
      const url = download.getUrl('0.20.2')

      snapshot('base url from CYPRESS_DOWNLOAD_MIRROR with trailing slash 1', normalize(url))
    })

    it('env var with subdirectory', () => {
      process.env.CYPRESS_DOWNLOAD_MIRROR = 'https://cypress.example.com/example'
      const url = download.getUrl('0.20.2')

      snapshot('base url from CYPRESS_DOWNLOAD_MIRROR with subdirectory 1', normalize(url))
    })

    it('env var with subdirectory and trailing slash', () => {
      process.env.CYPRESS_DOWNLOAD_MIRROR = 'https://cypress.example.com/example/'
      const url = download.getUrl('0.20.2')

      snapshot('base url from CYPRESS_DOWNLOAD_MIRROR with subdirectory and trailing slash 1', normalize(url))
    })
  })

  it('saves example.zip to options.downloadDestination', function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream('test/fixture/example.zip')
    })

    nock('https://download.cypress.io')
    .get('/desktop/1.2.3')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/some.zip',
      'x-version': '0.11.1',
    })

    const onProgress = sinon.stub().returns(undefined)

    return download.start({
      downloadDestination: this.options.downloadDestination,
      version: this.options.version,
      progress: { onProgress },
    })
    .then((responseVersion) => {
      expect(responseVersion).to.eq('0.11.1')

      return fs.statAsync(downloadDestination)
    })
  })

  it('resolves with response x-version if present', function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream('test/fixture/example.zip')
    })

    nock('https://download.cypress.io')
    .get('/desktop/1.2.3')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/some.zip',
      'x-version': '0.11.1',
    })

    return download.start(this.options).then((responseVersion) => {
      expect(responseVersion).to.eq('0.11.1')
    })
  })

  it('can specify cypress version in arguments', function () {
    this.options.version = '0.13.0'

    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream('test/fixture/example.zip')
    })

    nock('https://download.cypress.io')
    .get('/desktop/0.13.0')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/some.zip',
      'x-version': '0.13.0',
    })

    return download.start(this.options).then((responseVersion) => {
      expect(responseVersion).to.eq('0.13.0')

      return fs.statAsync(downloadDestination)
    })
  })

  it('catches download status errors and exits', function () {
    const ctx = this

    const err = new Error()

    err.statusCode = 404
    err.statusMessage = 'Not Found'
    this.options.version = null

    // not really the download error, but the easiest way to
    // test the error handling
    sinon.stub(fs, 'ensureDirAsync').rejects(err)

    return download
    .start(this.options)
    .then(() => {
      throw new Error('should have caught')
    })
    .catch((err) => {
      logger.error(err)

      return snapshot('download status errors 1', normalize(ctx.stdout.toString()))
    })
  })
})
