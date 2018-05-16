require('../../spec_helper')

const os = require('os')
const path = require('path')
const snapshot = require('snap-shot-it')

const fs = require(`${lib}/fs`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const unzip = require(`${lib}/tasks/unzip`)

const stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')

const version = '1.2.3'
const installDir = path.join(os.tmpdir(), 'Cypress', version)


describe('unzip', function () {
  require('mocha-banner').register()
  beforeEach(function () {
    this.stdout = stdout.capture()

    this.sandbox.stub(os, 'platform').returns('darwin')
    this.sandbox.stub(os, 'release').returns('test release')
    this.sandbox.stub(util, 'pkgVersion').returns(version)
  })

  afterEach(function () {
    stdout.restore()

    // return fs.removeAsync(installationDir)
  })

  it('throws when cannot unzip', function () {
    const ctx = this

    return unzip
    .start({
      zipFilePath: path.join('test', 'fixture', 'bad_example.zip'),
      installDir,
    })
    .then(() => {
      throw new Error('should have failed')
    })
    .catch((err) => {
      logger.error(err)

      snapshot('unzip error', normalize(ctx.stdout.toString()))
    })
  })

  it('can really unzip', function () {
    const onProgress = this.sandbox.stub()

    return unzip
    .start({
      zipFilePath: path.join('test', 'fixture', 'example.zip'),
      installDir,
      progress: { onProgress },
    })
    .then(() => {
      expect(onProgress).to.be.called
      return fs.statAsync(installDir)
    })
  })
})
