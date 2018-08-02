require('../../spec_helper')
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const Promise = require('bluebird')
const mockfs = require('mock-fs')
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

describe('/lib/tasks/install', function () {
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
  })

  context('.start', function () {
    beforeEach(function () {
      logger.reset()

      // sinon.stub(os, 'tmpdir').returns('/tmp')
      sinon.stub(util, 'isCi').returns(false)
      sinon.stub(util, 'isPostInstall').returns(false)
      sinon.stub(util, 'pkgVersion').returns(packageVersion)
      sinon.stub(download, 'start').resolves(packageVersion)
      sinon.stub(unzip, 'start').resolves()
      sinon.stub(Promise, 'delay').resolves()
      sinon.stub(fs, 'removeAsync').resolves()
      sinon.stub(state, 'getVersionDir').returns('/cache/Cypress/1.2.3')
      sinon.stub(state, 'getBinaryDir').returns('/cache/Cypress/1.2.3/Cypress.app')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves()
      sinon.stub(fs, 'ensureDirAsync').resolves(undefined)
      os.platform.returns('darwin')
    })

    describe('skips install', function () {

      it('when environment variable is set', function () {
        process.env.CYPRESS_INSTALL_BINARY = '0'

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

      it('warns when specifying cypress version in env', function () {
        const version = '0.12.1'
        process.env.CYPRESS_INSTALL_BINARY = version

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
        process.env.CYPRESS_INSTALL_BINARY = version
        sinon.stub(fs, 'pathExistsAsync').withArgs(version).resolves(true)

        const installDir = state.getVersionDir()
        return install.start()
        .then(() => {
          expect(unzip.start).to.be.calledWithMatch({
            zipFilePath: version,
            installDir,
          })
        })
      })

      it('can install local binary zip file from relative path', function () {
        const version = './cypress-resources/file.zip'
        mockfs({
          [version]: 'asdf',
        })
        process.env.CYPRESS_INSTALL_BINARY = version

        const installDir = state.getVersionDir()
        return install.start()
        .then(() => {
          expect(download.start).not.to.be.called
          expect(unzip.start).to.be.calledWithMatch({
            zipFilePath: path.resolve(version),
            installDir,
          })
        })
      })

      describe('when version is already installed', function () {
        beforeEach(function () {
          state.getBinaryPkgVersionAsync.resolves(packageVersion)

        })

        it('doesn\'t attempt to download', function () {
          return install.start()
          .then(() => {
            expect(download.start).not.to.be.called
            expect(state.getBinaryPkgVersionAsync).to.be.calledWith('/cache/Cypress/1.2.3/Cypress.app')
          })

        })

        it('logs \'skipping install\' when explicit cypress install', function () {
          return install.start()
          .then(() => {
            return snapshot(
              'version already installed - cypress install',
              normalize(this.stdout.toString())
            )
          })

        })

        it('logs when already installed when run from postInstall', function () {
          util.isPostInstall.returns(true)
          return install.start()
          .then(() => {
            snapshot(
              'version already installed - postInstall',
              normalize(this.stdout.toString())
            )
          })
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
          sinon.stub(util, 'isInstalledGlobally').returns(true)

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
          os.platform.returns('darwin')
          sinon.stub(state, 'getCacheDir').returns('/invalid/cache/dir')

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

      describe('CYPRESS_INSTALL_BINARY is URL or Zip', function () {
        it('uses cache when correct version installed given URL', function () {
          state.getBinaryPkgVersionAsync.resolves('1.2.3')
          util.pkgVersion.returns('1.2.3')
          process.env.CYPRESS_INSTALL_BINARY = 'www.cypress.io/cannot-download/2.4.5'
          return install.start()
          .then(() => {
            expect(download.start).to.not.be.called
          })
        })
        it('uses cache when mismatch version given URL ', function () {
          state.getBinaryPkgVersionAsync.resolves('1.2.3')
          util.pkgVersion.returns('4.0.0')
          process.env.CYPRESS_INSTALL_BINARY = 'www.cypress.io/cannot-download/2.4.5'
          return install.start()
          .then(() => {
            expect(download.start).to.not.be.called
          })
        })
        it('uses cache when correct version installed given Zip', function () {
          sinon.stub(fs, 'pathExistsAsync').withArgs('/path/to/zip.zip').resolves(true)

          state.getBinaryPkgVersionAsync.resolves('1.2.3')
          util.pkgVersion.returns('1.2.3')

          process.env.CYPRESS_INSTALL_BINARY = '/path/to/zip.zip'
          return install.start()
          .then(() => {
            expect(unzip.start).to.not.be.called
          })
        })
        it('uses cache when mismatch version given Zip ', function () {
          sinon.stub(fs, 'pathExistsAsync').withArgs('/path/to/zip.zip').resolves(true)

          state.getBinaryPkgVersionAsync.resolves('1.2.3')
          util.pkgVersion.returns('4.0.0')
          process.env.CYPRESS_INSTALL_BINARY = '/path/to/zip.zip'
          return install.start()
          .then(() => {
            expect(unzip.start).to.not.be.called
          })
        })
      })

      describe('CYPRESS_BINARY_VERSION', function () {
        it('throws when env var CYPRESS_BINARY_VERSION', function () {
          process.env.CYPRESS_BINARY_VERSION = '/asf/asf'

          return install.start()
          .then(() => {
            throw new Error('should have thrown')
          })
          .catch((err) => {
            logger.error(err)

            snapshot(
              'error for removed CYPRESS_BINARY_VERSION',
              normalize(this.stdout.toString())
            )
          })
        })
      })
    })

    it('is silent when log level is silent', function () {
      process.env.npm_config_loglevel = 'silent'
      return install.start()
      .then(() => {
        return snapshot(
          'silent install',
          normalize(`[no output]${this.stdout.toString()}`)
        )
      })
    })
  })

})
