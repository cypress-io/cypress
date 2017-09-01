require('../spec_helper')

const chalk = require('chalk')
const download = require('../../lib/download/download')
const index = require('../../lib/download/index')
const utils = require('../../lib/download/utils')
const unzip = require('../../lib/download/unzip')
const logger = require('../../lib/logger')
const fse = require('fs-extra')

const packageVersion = require('../../package').version

describe('index', function () {
  beforeEach(() => {
    // allow simpler log message comparison without
    // chalk's terminal control strings
    chalk.enabled = false
  })

  afterEach(() => {
    chalk.enabled = true
  })

  context('#install', function () {
    beforeEach(function () {
      this.sandbox.stub(logger, 'log')
      this.sandbox.stub(download, 'start').resolves()
      this.sandbox.stub(utils, 'getInstalledVersion').resolves()
      this.sandbox.stub(utils, 'writeInstalledVersion').resolves()
      this.sandbox.stub(utils, 'clearVersionState').resolves()
    })

    describe('override version', function () {
      afterEach(function () {
        delete process.env.CYPRESS_VERSION
      })

      it('can specify cypress version in env', function () {
        const version = '0.12.1'
        process.env.CYPRESS_VERSION = version

        return index.install()
          .then(() => {
            const msg = `Forcing CYPRESS_VERSION ${version}`
            expect(logger.log.calledWith(msg)).to.be.true
            expect(download.start).to.be.calledWith({
              displayOpen: false,
              version,
              cypressVersion: version,
            })
          })
      })

      it('can install local binary zip file without download', function () {
        const version = '/tmp/local/file.zip'
        process.env.CYPRESS_VERSION = version
        this.sandbox.stub(fse, 'statAsync').withArgs(version).resolves()
        this.sandbox.stub(unzip, 'start').resolves()

        return index.install()
          .then(() => {
            expect(unzip.start).calledWith({
              zipDestination: version,
              destination: utils.getInstallationDir(),
              executable: utils.getPathToUserExecutable(),
            })
            expect(utils.writeInstalledVersion).calledWith('unknown')
          })
      })
    })

    describe('when version is already installed', function () {
      beforeEach(function () {
        utils.getInstalledVersion.resolves(packageVersion)
        return index.install()
      })

      it('logs message', function () {
        const msg = `Cypress ${packageVersion} already installed.`
        expect(logger.log.calledWith(msg)).to.be.true
      })

      it('does not download', function () {
        expect(download.start).not.to.be.called
      })
    })

    describe('when getting installed version fails', function () {
      beforeEach(function () {
        utils.getInstalledVersion.rejects(new Error('no'))
        return index.install()
      })

      it('logs message', function () {
        expect(logger.log.calledWith('Cypress executable was not found.')).to.be.true
        expect(logger.log.calledWith(`Installing Cypress (version: ${packageVersion}).`)).to.be.true
      })

      it('downloads', function () {
        expect(download.start).to.be.calledWith({
          displayOpen: false,
          cypressVersion: packageVersion,
          version: packageVersion,
        })
      })
    })

    describe('when getting installed version does not match needed version', function () {
      beforeEach(function () {
        utils.getInstalledVersion.resolves('x.x.x')
        return index.install()
      })

      it('logs message', function () {
        const versionMessage = `Installed version (x.x.x) does not match needed version (${packageVersion}).`
        expect(logger.log.calledWith(versionMessage)).to.be.true
        const installMessage = `Installing Cypress (version: ${packageVersion}).`
        expect(logger.log.calledWith(installMessage)).to.be.true
      })

      it('downloads', function () {
        expect(download.start).to.be.calledWith({
          displayOpen: false,
          cypressVersion: packageVersion,
          version: packageVersion,
        })
      })
    })

    describe('with force: true', function () {
      beforeEach(function () {
        utils.getInstalledVersion.resolves(packageVersion)
        return index.install({ force: true })
      })

      it('clears version state', function () {
        expect(utils.clearVersionState).to.be.called
      })

      it('forces download even if version matches', function () {
        expect(download.start).to.be.called
      })
    })
  })
})
