require('../../spec_helper')

const chalk = require('chalk')
const Promise = require('bluebird')
const snapshot = require('snap-shot-it')

const stdout = require('../../support/stdout')

const fs = require(`${lib}/fs`)
const download = require(`${lib}/tasks/download`)
const install = require(`${lib}/tasks/install`)
const info = require(`${lib}/tasks/info`)
const unzip = require(`${lib}/tasks/unzip`)
const logger = require(`${lib}/logger`)
const util = require(`${lib}/util`)

const normalize = require('../../support/normalize')

const packageVersion = '1.2.3'
const downloadDestination = {
  filename: 'path/to/cypress.zip',
  downloaded: true,
}

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
  })

  context('.start', function () {
    beforeEach(function () {
      logger.reset()

      this.sandbox.stub(util, 'isCi').returns(false)
      this.sandbox.stub(util, 'pkgVersion').returns(packageVersion)
      this.sandbox.stub(download, 'start').resolves(downloadDestination)
      this.sandbox.stub(unzip, 'start').resolves()
      this.sandbox.stub(Promise, 'delay').resolves()
      this.sandbox.stub(fs, 'removeAsync').resolves()
      this.sandbox.stub(info, 'getPathToUserExecutableDir').returns('/path/to/binary/dir/')
      this.sandbox.stub(info, 'getInstalledVersion').resolves()
      this.sandbox.stub(info, 'writeInstalledVersion').resolves()
      this.sandbox.stub(info, 'clearVersionState').resolves()
    })

    describe('skips install', function () {
      afterEach(function () {
        delete process.env.CYPRESS_SKIP_BINARY_INSTALL
      })

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
            version,
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
        this.sandbox.stub(fs, 'statAsync').withArgs(version).resolves()

        return install.start()
        .then(() => {
          expect(unzip.start).calledWith({
            zipDestination: version,
            destination: info.getInstallationDir(),
            executable: info.getPathToUserExecutableDir(),
          })
          expect(info.writeInstalledVersion).calledWith('unknown')
        })
      })
    })

    describe('when version is already installed', function () {
      beforeEach(function () {
        info.getInstalledVersion.resolves(packageVersion)

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
        info.getInstalledVersion.rejects(new Error('no'))

        return install.start()
      })

      it('logs message and starts download', function () {
        expect(download.start).to.be.calledWithMatch({
          version: packageVersion,
        })

        expect(unzip.start).to.be.calledWithMatch({
          version: packageVersion,
        })

        snapshot(
          'continues installing on failure',
          normalize(this.stdout.toString())
        )
      })
    })

    describe('when there is no install version', function () {
      beforeEach(function () {
        info.getInstalledVersion.resolves(null)

        return install.start()
      })

      it('logs message and starts download', function () {
        expect(info.clearVersionState).to.be.called

        expect(download.start).to.be.calledWithMatch({
          version: packageVersion,
        })

        expect(unzip.start).to.be.calledWithMatch({
          version: packageVersion,
        })

        // cleans up the zip file
        expect(fs.removeAsync).to.be.calledWith(
          downloadDestination.filename
        )

        snapshot(
          'installs without existing installation',
          normalize(this.stdout.toString())
        )
      })
    })

    describe('when getting installed version does not match needed version', function () {
      beforeEach(function () {
        info.getInstalledVersion.resolves('x.x.x')

        return install.start()
      })

      it('logs message and starts download', function () {
        expect(download.start).to.be.calledWithMatch({
          version: packageVersion,
        })

        expect(unzip.start).to.be.calledWithMatch({
          version: packageVersion,
        })

        snapshot(
          'installed version does not match needed version',
          normalize(this.stdout.toString())
        )
      })
    })

    describe('with force: true', function () {
      beforeEach(function () {
        info.getInstalledVersion.resolves(packageVersion)

        return install.start({ force: true })
      })

      it('logs message and starts download', function () {
        expect(info.clearVersionState).to.be.called

        expect(download.start).to.be.calledWithMatch({
          version: packageVersion,
        })

        expect(unzip.start).to.be.calledWithMatch({
          version: packageVersion,
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

        info.getInstalledVersion.resolves('x.x.x')

        return install.start()
      })

      it('logs global warning and download', function () {
        expect(download.start).to.be.calledWithMatch({
          version: packageVersion,
        })

        expect(unzip.start).to.be.calledWithMatch({
          version: packageVersion,
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

        info.getInstalledVersion.resolves('x.x.x')

        return install.start()
      })

      it('uses verbose renderer', function () {
        snapshot(
          'installing in ci',
          normalize(this.stdout.toString())
        )
      })
    })

    describe('when running without a terminal', function () {
      beforeEach(function () {
        util.isCi.returns(false)
        this.sandbox.stub(util, 'isTerminal').returns(false)

        info.getInstalledVersion.resolves('x.x.x')

        return install.start()
      })

      it('uses verbose renderer', function () {
        snapshot(
          'installing without a terminal',
          normalize(this.stdout.toString())
        )
      })
    })
  })
})
