require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const nock = require('nock')
const hasha = require('hasha')
const debug = require('debug')('test')
const snapshot = require('../../support/snapshot')

const fs = require(`${lib}/fs`)
const logger = require(`${lib}/logger`)
const util = require(`${lib}/util`)
const download = require(`${lib}/tasks/download`)

const stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')
const { mockSpawn } = require('../../support/spawn-mock')

const downloadDestination = path.join(os.tmpdir(), 'Cypress', 'download', 'cypress.zip')
const version = '1.2.3'
const examplePath = 'test/fixture/example.zip'

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

    os.platform.returns('OS')
    sinon.stub(util, 'pkgVersion').returns('1.2.3')
    sinon.stub(util, 'cwd').returns(rootFolder)
  })

  afterEach(function () {
    stdout.restore()
  })

  context('download url', () => {
    it('returns url', () => {
      const url = download.getUrl('ARCH')

      la(is.url(url), url)
    })

    it('returns latest desktop url', () => {
      const url = download.getUrl('ARCH')

      snapshot('latest desktop url 1', normalize(url))
    })

    it('returns specific desktop version url', () => {
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('specific version desktop url 1', normalize(url))
    })

    it('returns custom url from template', () => {
      process.env.CYPRESS_DOWNLOAD_PATH_TEMPLATE = '${endpoint}/${platform}-${arch}/cypress.zip'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('desktop url from template', normalize(url))
    })

    it('returns custom url from template with version', () => {
      process.env.CYPRESS_DOWNLOAD_PATH_TEMPLATE = 'https://mycompany/${version}/${platform}-${arch}/cypress.zip'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('desktop url from template with version', normalize(url))
    })

    it('returns custom url from template with escaped dollar sign', () => {
      process.env.CYPRESS_DOWNLOAD_PATH_TEMPLATE = '\\${endpoint}/\\${platform}-\\${arch}/cypress.zip'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('desktop url from template with escaped dollar sign', normalize(url))
    })

    it('returns custom url from template wrapped in quote', () => {
      process.env.CYPRESS_DOWNLOAD_PATH_TEMPLATE = '"${endpoint}/${platform}-${arch}/cypress.zip"'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('desktop url from template wrapped in quote', normalize(url))
    })

    it('returns custom url from template with escaped dollar sign wrapped in quote', () => {
      process.env.CYPRESS_DOWNLOAD_PATH_TEMPLATE = '"\\${endpoint}/\\${platform}-\\${arch}/cypress.zip"'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('desktop url from template with escaped dollar sign wrapped in quote', normalize(url))
    })

    it('returns input if it is already an https link', () => {
      const url = 'https://somewhere.com'
      const result = download.getUrl('ARCH', url)

      expect(result).to.equal(url)
    })

    it('returns input if it is already an http link', () => {
      const url = 'http://local.com'
      const result = download.getUrl('ARCH', url)

      expect(result).to.equal(url)
    })
  })

  context('download base url from CYPRESS_DOWNLOAD_MIRROR env var', () => {
    it('env var', () => {
      process.env.CYPRESS_DOWNLOAD_MIRROR = 'https://cypress.example.com'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('base url from CYPRESS_DOWNLOAD_MIRROR 1', normalize(url))
    })

    it('env var with trailing slash', () => {
      process.env.CYPRESS_DOWNLOAD_MIRROR = 'https://cypress.example.com/'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('base url from CYPRESS_DOWNLOAD_MIRROR with trailing slash 1', normalize(url))
    })

    it('env var with subdirectory', () => {
      process.env.CYPRESS_DOWNLOAD_MIRROR = 'https://cypress.example.com/example'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('base url from CYPRESS_DOWNLOAD_MIRROR with subdirectory 1', normalize(url))
    })

    it('env var with subdirectory and trailing slash', () => {
      process.env.CYPRESS_DOWNLOAD_MIRROR = 'https://cypress.example.com/example/'
      const url = download.getUrl('ARCH', '0.20.2')

      snapshot('base url from CYPRESS_DOWNLOAD_MIRROR with subdirectory and trailing slash 1', normalize(url))
    })
  })

  it('saves example.zip to options.downloadDestination', function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream(examplePath)
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

  context('verify downloaded file', function () {
    before(function () {
      this.expectedChecksum = hasha.fromFileSync(examplePath)
      this.expectedFileSize = fs.statSync(examplePath).size
      this.onProgress = sinon.stub().returns(undefined)
      debug('example file %s should have checksum %s and file size %d',
        examplePath, this.expectedChecksum, this.expectedFileSize)
    })

    it('throws if file size is different from expected', function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      }, {
        // definitely incorrect file size
        'content-length': '10',
      })

      return expect(download.start({
        downloadDestination: this.options.downloadDestination,
        version: this.options.version,
        progress: { onProgress: this.onProgress },
      })).to.be.rejected
    })

    it('throws if file size is different from expected x-amz-meta-size', function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      }, {
        // definitely incorrect file size
        'x-amz-meta-size': '10',
      })

      return expect(download.start({
        downloadDestination: this.options.downloadDestination,
        version: this.options.version,
        progress: { onProgress: this.onProgress },
      })).to.be.rejected
    })

    it('throws if checksum is different from expected', function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      }, {
        'x-amz-meta-checksum': 'incorrect-checksum',
      })

      return expect(download.start({
        downloadDestination: this.options.downloadDestination,
        version: this.options.version,
        progress: { onProgress: this.onProgress },
      })).to.be.rejected
    })

    it('throws if checksum and file size are different from expected', function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      }, {
        'x-amz-meta-checksum': 'incorrect-checksum',
        'x-amz-meta-size': '10',
      })

      return expect(download.start({
        downloadDestination: this.options.downloadDestination,
        version: this.options.version,
        progress: { onProgress: this.onProgress },
      })).to.be.rejected
    })

    it('passes when checksum and file size match', function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        debug('creating read stream for %s', examplePath)

        return fs.createReadStream(examplePath)
      }, {
        'x-amz-meta-checksum': this.expectedChecksum,
        'x-amz-meta-size': String(this.expectedFileSize),
      })

      debug('downloading %s to %s for test version %s',
        examplePath, this.options.downloadDestination, this.options.version)

      return download.start({
        downloadDestination: this.options.downloadDestination,
        version: this.options.version,
        progress: { onProgress: this.onProgress },
      })
    })
  })

  it('resolves with response x-version if present', function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream(examplePath)
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

  it('handles quadruple redirect with response x-version to the latest if present', function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream(examplePath)
    })

    nock('https://aws.amazon.com')
    .get('/someone.zip')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/somebody.zip',
      'x-version': '0.11.2',
    })

    nock('https://aws.amazon.com')
    .get('/something.zip')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/some.zip',
      'x-version': '0.11.4',
    })

    nock('https://aws.amazon.com')
    .get('/somebody.zip')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/something.zip',
      'x-version': '0.11.3',
    })

    nock('https://download.cypress.io')
    .get('/desktop/1.2.3')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/someone.zip',
      'x-version': '0.11.1',
    })

    return download.start(this.options).then((responseVersion) => {
      expect(responseVersion).to.eq('0.11.4')
    })
  })

  it('errors on too many redirects', async function () {
    function stubRedirects () {
      nock('https://aws.amazon.com')
      .get('/some.zip')
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      })

      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/someone.zip',
        'x-version': '0.11.1',
      })

      nock('https://aws.amazon.com')
      .get('/someone.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somebody.zip',
        'x-version': '0.11.2',
      })

      nock('https://aws.amazon.com')
      .get('/somebody.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/something.zip',
        'x-version': '0.11.3',
      })

      nock('https://aws.amazon.com')
      .get('/something.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somewhat.zip',
        'x-version': '0.11.4',
      })

      nock('https://aws.amazon.com')
      .get('/somewhat.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/sometime.zip',
        'x-version': '0.11.5',
      })

      nock('https://aws.amazon.com')
      .get('/sometime.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somewhen.zip',
        'x-version': '0.11.6',
      })

      nock('https://aws.amazon.com')
      .get('/somewhen.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somewise.zip',
        'x-version': '0.11.7',
      })

      nock('https://aws.amazon.com')
      .get('/somewise.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/someways.zip',
        'x-version': '0.11.8',
      })

      nock('https://aws.amazon.com')
      .get('/someways.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somerset.zip',
        'x-version': '0.11.9',
      })

      nock('https://aws.amazon.com')
      .get('/somerset.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somedeal.zip',
        'x-version': '0.11.10',
      })

      nock('https://aws.amazon.com')
      .get('/somedeal.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/some.zip',
        'x-version': '0.11.11',
      })
    }

    stubRedirects()

    await download.start(this.options).catch((error) => {
      expect(error).to.be.instanceof(Error)
      expect(error.message).to.contain('redirect loop')
    })

    stubRedirects()

    // Double check to make sure that raising redirectTTL changes result
    await download.start({ ...this.options, redirectTTL: 12 }).then((responseVersion) => {
      expect(responseVersion).to.eq('0.11.11')
    })
  })

  it('can specify cypress version in arguments', function () {
    this.options.version = '0.13.0'

    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream(examplePath)
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

  context('architecture detection', () => {
    beforeEach(() => {
      sinon.stub(os, 'arch')
    })

    context('Apple Silicon/M1', () => {
      function nockDarwinArm64 () {
        return nock('https://download.cypress.io')
        .get('/desktop/1.2.3')
        .query({ arch: 'arm64', platform: 'darwin' })
        .reply(200, undefined, {
          'x-version': '1.2.3',
        })
      }

      it('downloads darwin-arm64 on M1', async function () {
        os.platform.returns('darwin')
        os.arch.returns('arm64')
        nockDarwinArm64()

        const responseVersion = await download.start(this.options)

        expect(responseVersion).to.eq('1.2.3')

        await fs.statAsync(downloadDestination)
      })

      it('downloads darwin-arm64 on M1 translated by Rosetta', async function () {
        os.platform.returns('darwin')
        os.arch.returns('x64')
        nockDarwinArm64()

        sinon.stub(cp, 'spawn').withArgs('sysctl', ['-n', 'sysctl.proc_translated'])
        .callsFake(mockSpawn(((cp) => {
          cp.stdout.write('1')
          cp.emit('exit', 0, null)
          cp.end()
        })))

        const responseVersion = await download.start(this.options)

        expect(responseVersion).to.eq('1.2.3')

        await fs.statAsync(downloadDestination)
      })
    })

    context('Linux arm64/aarch64', () => {
      function nockLinuxArm64 () {
        return nock('https://download.cypress.io')
        .get('/desktop/1.2.3')
        .query({ arch: 'arm64', platform: 'linux' })
        .reply(200, undefined, {
          'x-version': '1.2.3',
        })
      }

      it('downloads linux-arm64 on arm64 processor', async function () {
        os.platform.returns('linux')
        os.arch.returns('arm64')
        nockLinuxArm64()

        const responseVersion = await download.start(this.options)

        expect(responseVersion).to.eq('1.2.3')

        await fs.statAsync(downloadDestination)
      })

      it('downloads linux-arm64 on non-arm64 node running on arm machine', async function () {
        os.platform.returns('linux')
        os.arch.returns('x64')
        sinon.stub(cp, 'spawn')

        for (const arch of ['aarch64_be', 'aarch64', 'armv8b', 'armv8l']) {
          nockLinuxArm64()
          cp.spawn.withArgs('uname', ['-m'])
          .callsFake(mockSpawn(((cp) => {
            cp.stdout.write(arch)
            cp.emit('exit', 0, null)
            cp.end()
          })))

          const responseVersion = await download.start(this.options)

          expect(responseVersion).to.eq('1.2.3')

          await fs.statAsync(downloadDestination)
        }
      })
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

  context('with proxy env vars', () => {
    const testUriHttp = 'http://anything.com'
    const testUriHttps = 'https://anything.com'

    beforeEach(function () {
      this.env = _.clone(process.env)
      // prevent ambient environment masking of environment variables referenced in this test

      ;([
        'NO_PROXY', 'http_proxy',
        'https_proxy', 'npm_config_ca', 'npm_config_cafile',
        'npm_config_https_proxy', 'npm_config_proxy',
      ]).forEach((e) => {
        delete process.env[e.toLowerCase()]
        delete process.env[e.toUpperCase()]
      })

      // add a default no_proxy which does not match the testUri
      process.env.NO_PROXY = 'localhost,.org'
    })

    afterEach(function () {
      process.env = this.env
    })

    it('uses http_proxy on http request', () => {
      process.env.http_proxy = 'http://foo'
      expect(download.getProxyForUrlWithNpmConfig(testUriHttp)).to.eq('http://foo')
    })

    it('ignores http_proxy on https request', () => {
      process.env.http_proxy = 'http://foo'
      expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).to.eq(null)
      process.env.https_proxy = 'https://bar'
      expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).to.eq('https://bar')
    })

    it('falls back to npm_config_proxy', () => {
      process.env.npm_config_proxy = 'http://foo'
      expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).to.eq('http://foo')
      process.env.npm_config_https_proxy = 'https://bar'
      expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).to.eq('https://bar')
      process.env.https_proxy = 'https://baz'
      expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).to.eq('https://baz')
    })

    it('respects no_proxy on http and https requests', () => {
      process.env.NO_PROXY = 'localhost,.com'

      process.env.http_proxy = 'http://foo'
      process.env.https_proxy = 'https://bar'

      expect(download.getProxyForUrlWithNpmConfig(testUriHttp)).to.eq(null)
      expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).to.eq(null)
    })

    it('ignores no_proxy for npm proxy configs, prefers https over http', () => {
      process.env.NO_PROXY = 'localhost,.com'

      process.env.npm_config_proxy = 'http://foo'
      expect(download.getProxyForUrlWithNpmConfig(testUriHttp)).to.eq('http://foo')
      expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).to.eq('http://foo')

      process.env.npm_config_https_proxy = 'https://bar'
      expect(download.getProxyForUrlWithNpmConfig(testUriHttp)).to.eq('https://bar')
      expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).to.eq('https://bar')
    })
  })

  context('with CA and CAFILE env vars', () => {
    beforeEach(function () {
      this.env = _.clone(process.env)
    })

    afterEach(function () {
      process.env = this.env
    })

    it('returns undefined if not set', () => {
      return download.getCA().then((ca) => {
        expect(ca).to.be.undefined
      })
    })

    it('returns CA from npm_config_ca', () => {
      process.env.npm_config_ca = 'foo'

      return download.getCA().then((ca) => {
        expect(ca).to.eqls('foo')
      })
    })

    it('returns CA from npm_config_cafile', () => {
      process.env.npm_config_cafile = 'test/fixture/cafile.pem'

      return download.getCA().then((ca) => {
        expect(ca).to.eqls('bar\n')
      })
    })

    it('returns undefined if failed reading npm_config_cafile', () => {
      process.env.npm_config_cafile = 'test/fixture/not-exists.pem'

      return download.getCA().then((ca) => {
        expect(ca).to.be.undefined
      })
    })
  })
})
