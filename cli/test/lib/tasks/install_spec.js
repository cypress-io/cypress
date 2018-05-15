require('../../spec_helper')
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const Promise = require('bluebird')
const snapshot = require('snap-shot-it')

const stdout = require('../../support/stdout')

const fs = require(`${lib}/fs`)
const download = require(`${lib}/tasks/download`)
const install = require(`${lib}/tasks/install`)
const state = require(`${lib}/tasks/state`)
const unzip = require(`${lib}/tasks/unzip`)
const logger = require(`${lib}/logger`)
const util = require(`${lib}/util`)

const normalize = require('../../support/normalize')

const packageVersion = '1.2.3'
const downloadDestination = path.join(os.tmpdir(), 'cypress.zip')
const installDir = '/cache/Cypress/1.2.3'

describe('install', function () {
  require('mocha-banner').register()

  beforeEach(function () {
    this.stdout = stdout.capture()

    // allow simpler log message comparison without
    // chalk's terminal control strings
    chalk.enabled = false
  })

  afterEach(() => {
    stdout.restore()

    chalk.enabled = true
    delete process.env.CYPRESS_SKIP_BINARY_INSTALL
  })

  context('.start', function () {
    beforeEach(function () {
      logger.reset()

      // this.sandbox.stub(os, 'tmpdir').returns('/tmp')
      this.sandbox.stub(util, 'isCi').returns(false)
      this.sandbox.stub(util, 'pkgVersion').returns(packageVersion)
      this.sandbox.stub(download, 'start').resolves(packageVersion)
      this.sandbox.stub(unzip, 'start').resolves()
      this.sandbox.stub(Promise.prototype, 'delay').resolves()
      this.sandbox.stub(fs, 'removeAsync').resolves()
      this.sandbox.stub(state, 'getVersionDir').returns('/cache/Cypress/1.2.3')
      this.sandbox.stub(state, 'getBinaryDir').returns('/cache/Cypress/1.2.3/Cypress.app')
      this.sandbox.stub(state, 'getBinaryPkgVersionAsync').resolves()
      this.sandbox.stub(fs, 'ensureDirAsync').resolves(undefined)
    })

    describe('skips install', function () {


      it('when environment variable is set', function () {
        process.env.CYPRESS_SKIP_BINARY_INSTALL = true

        return install.start()
        .then(() => {
          expect(download.start).not.to.be.called

          snapshot(
            'skip installation',
            normalize(this.stdout.toString())
          )
        })
      })
    })

    describe('override version', function () {
      afterEach(function () {
        delete process.env.CYPRESS_BINARY_VERSION
      })

      it('warns when specifying cypress version in env', function () {
        const version = '0.12.1'
        process.env.CYPRESS_BINARY_VERSION = version

        return install.start()
        .then(() => {
          expect(download.start).to.be.calledWithMatch({
            version,
          })

          expect(unzip.start).to.be.calledWithMatch({
            zipFilePath: downloadDestination,
          })

          snapshot(
            'specify version in env vars',
            normalize(this.stdout.toString())
          )
        })
      })

      it('can install local binary zip file without download', function () {
        const version = '/tmp/local/file.zip'
        process.env.CYPRESS_BINARY_VERSION = version
        this.sandbox.stub(fs, 'pathExistsAsync').withArgs(version).resolves(true)

        const installDir = state.getVersionDir()
        return install.start()
        .then(() => {
          expect(unzip.start).to.be.calledWithMatch({
            zipFilePath: version,
            installDir,
          })
        })
      })

      describe('when version is already installed', function () {
        beforeEach(function () {
          state.getBinaryPkgVersionAsync.resolves(packageVersion)

          return install.start()
        })

        it('logs noop message', function () {
          expect(download.start).not.to.be.called

          snapshot(
            'version already installed',
            normalize(this.stdout.toString())
          )
        })
      })

      describe('when getting installed version fails', function () {
        beforeEach(function () {
          state.getBinaryPkgVersionAsync.resolves(null)

          return install.start()
        })

        it('logs message and starts download', function () {
          expect(download.start).to.be.calledWithMatch({
            version: packageVersion,
          })

          expect(unzip.start).to.be.calledWithMatch({
            installDir,
          })

          snapshot(
            'continues installing on failure',
            normalize(this.stdout.toString())
          )
        })
      })

      describe('when there is no install version', function () {
        beforeEach(function () {
          state.getBinaryPkgVersionAsync.resolves(null)

          return install.start()
        })

        it('logs message and starts download', function () {

          expect(download.start).to.be.calledWithMatch({
            version: packageVersion,
          })

          expect(unzip.start).to.be.calledWithMatch({
            installDir,
          })

          // cleans up the zip file
          expect(fs.removeAsync).to.be.calledWith(
            downloadDestination
          )

          snapshot(
            'installs without existing installation',
            normalize(this.stdout.toString())
          )
        })
      })

      describe('when getting installed version does not match needed version', function () {
        beforeEach(function () {
          state.getBinaryPkgVersionAsync.resolves('x.x.x')

          return install.start()
        })

        it('logs message and starts download', function () {
          expect(download.start).to.be.calledWithMatch({
            version: packageVersion,
          })

          expect(unzip.start).to.be.calledWithMatch({
            installDir,
          })

          snapshot(
            'installed version does not match needed version',
            normalize(this.stdout.toString())
          )
        })
      })

      describe('with force: true', function () {
        beforeEach(function () {
          state.getBinaryPkgVersionAsync.resolves(packageVersion)

          return install.start({ force: true })
        })

        it('logs message and starts download', function () {

          expect(download.start).to.be.calledWithMatch({
            version: packageVersion,
          })

          expect(unzip.start).to.be.calledWithMatch({
            installDir,
          })

          snapshot(
            'forcing true always installs',
            normalize(this.stdout.toString())
          )
        })
      })

      describe('as a global install', function () {
        beforeEach(function () {
          this.sandbox.stub(util, 'isInstalledGlobally').returns(true)

          state.getBinaryPkgVersionAsync.resolves('x.x.x')

          return install.start()
        })

        it('logs global warning and download', function () {
          expect(download.start).to.be.calledWithMatch({
            version: packageVersion,
          })

          expect(unzip.start).to.be.calledWithMatch({
            installDir,
          })

          snapshot(
            'warning installing as global',
            normalize(this.stdout.toString())
          )
        })
      })

      describe('when running in CI', function () {
        beforeEach(function () {
          util.isCi.returns(true)

          state.getBinaryPkgVersionAsync.resolves('x.x.x')

          return install.start()
        })

        it('uses verbose renderer', function () {
          snapshot(
            'installing in ci',
            normalize(this.stdout.toString())
          )
        })
      })

      describe('failed write access to cache directory', function () {
        it('logs error on failure', function () {
          this.sandbox.stub(os, 'platform').returns('darwin')
          this.sandbox.stub(state, 'getCacheDir').returns('/invalid/cache/dir')

          const err = new Error('EACCES: permission denied, mkdir \'/invalid\'')
          err.code = 'EACCES'
          fs.ensureDirAsync.rejects(err)

          return install.start()
          .then(() => {
            throw new Error('should have caught error')
          })
          .catch((err) => {
            logger.error(err)

            snapshot(
              'invalid cache directory',
              normalize(this.stdout.toString())
            )
          })
        })
      })

      describe('CYPRESS_BINARY_INSTALL is URL or Zip', function () {
        it('uses cache when correct version installed given URL', function () {
          state.getBinaryPkgVersionAsync.resolves('1.2.3')
          util.pkgVersion.returns('1.2.3')
          process.env.CYPRESS_BINARY_VERSION = 'www.cypress.io/cannot-download/2.4.5'
          return install.start()
          .then(() => {
            expect(download.start).to.not.be.called
          })
        })
        it('uses cache when mismatch version given URL ', function () {
          state.getBinaryPkgVersionAsync.resolves('1.2.3')
          util.pkgVersion.returns('4.0.0')
          process.env.CYPRESS_BINARY_VERSION = 'www.cypress.io/cannot-download/2.4.5'
          return install.start()
          .then(() => {
            expect(download.start).to.not.be.called
          })
        })
        it('uses cache when correct version installed given Zip', function () {
          this.sandbox.stub(fs, 'pathExistsAsync').withArgs('/path/to/zip.zip').resolves(true)

          state.getBinaryPkgVersionAsync.resolves('1.2.3')
          util.pkgVersion.returns('1.2.3')

          process.env.CYPRESS_BINARY_VERSION = '/path/to/zip.zip'
          return install.start()
          .then(() => {
            expect(unzip.start).to.not.be.called
          })
        })
        it('uses cache when mismatch version given Zip ', function () {
          this.sandbox.stub(fs, 'pathExistsAsync').withArgs('/path/to/zip.zip').resolves(true)

          state.getBinaryPkgVersionAsync.resolves('1.2.3')
          util.pkgVersion.returns('4.0.0')
          process.env.CYPRESS_BINARY_VERSION = '/path/to/zip.zip'
          return install.start()
          .then(() => {
            expect(unzip.start).to.not.be.called
          })
        })
      })
    })
  })
})
