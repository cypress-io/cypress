require('../../spec_helper')
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const Promise = require('bluebird')
const mockfs = require('mock-fs')
const snapshot = require('../../support/snapshot')

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
const downloadDestination = path.join(os.tmpdir(), `cypress-${process.pid}.zip`)
const installDir = '/cache/Cypress/1.2.3'

describe('/lib/tasks/install', function () {
  require('mocha-banner').register()

  beforeEach(function () {
    this.stdout = stdout.capture()

    // allow simpler log message comparison without
    // chalk's terminal control strings
    chalk.level = 0
  })

  afterEach(() => {
    stdout.restore()

    chalk.level = 3
  })

  context('.start', function () {
    beforeEach(function () {
      logger.reset()

      sinon.stub(util, 'isCi').returns(false)
      sinon.stub(util, 'isPostInstall').returns(false)
      sinon.stub(util, 'pkgVersion').returns(packageVersion)
      sinon.stub(download, 'start').resolves(packageVersion)
      sinon.stub(unzip, 'start').resolves()
      sinon.stub(Promise, 'delay').resolves()
      sinon.stub(fs, 'removeAsync').resolves()
      sinon.stub(state, 'getVersionDir').returns('/cache/Cypress/1.2.3')
      sinon.stub(state, 'getBinaryDir').returns('/cache/Cypress/1.2.3/Cypress.app')
      sinon.stub(state, 'getBinaryPkgAsync').resolves()
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
            'skip installation 1',
            normalize(this.stdout.toString()),
          )
        })
      })
    })

    describe('non-stable builds', () => {
      const buildInfo = {
        stable: false,
        commitSha: '3b7f0b5c59def1e9b5f385bd585c9b2836706c29',
        commitBranch: 'aBranchName',
        commitDate: new Date('11-27-1996').toISOString(),
      }

      function runInstall () {
        return install.start({ buildInfo })
      }

      it('install from a constructed CDN URL', async function () {
        await runInstall()

        expect(download.start).to.be.calledWithMatch({
          version: 'https://cdn.cypress.io/beta/binary/0.0.0-development/darwin-x64/aBranchName-3b7f0b5c59def1e9b5f385bd585c9b2836706c29/cypress.zip',
        })
      })

      it('logs a warning about installing a pre-release', async function () {
        await runInstall()
        snapshot(normalize(this.stdout.toString()))
      })

      it('installs to the expected pre-release cache dir', async function () {
        state.getVersionDir.restore()
        await runInstall()
        expect(unzip.start).to.be.calledWithMatch({ installDir: sinon.match(/\/Cypress\/beta\-1\.2\.3\-aBranchName\-3b7f0b5c$/) })
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
            'specify version in env vars 1',
            normalize(this.stdout.toString()),
          )
        })
      })

      it('trims environment variable before installing', function () {
        // note how the version has extra spaces around it on purpose
        const filename = '/tmp/local/file.zip'
        const version = ` ${filename}   `

        process.env.CYPRESS_INSTALL_BINARY = version
        // internally, the variable should be trimmed and just filename checked
        sinon.stub(fs, 'pathExistsAsync').withArgs(filename).resolves(true)

        const installDir = state.getVersionDir()

        return install.start()
        .then(() => {
          expect(unzip.start).to.be.calledWithMatch({
            zipFilePath: filename,
            installDir,
          })
        })
      })

      it('removes double quotes around the environment variable before installing', function () {
        // note how the version has extra spaces around it on purpose
        // and there are double quotes
        const filename = '/tmp/local/file.zip'
        const version = ` "${filename}"   `

        process.env.CYPRESS_INSTALL_BINARY = version
        // internally, the variable should be trimmed, double quotes removed
        //  and just filename checked against the file system
        sinon.stub(fs, 'pathExistsAsync').withArgs(filename).resolves(true)

        const installDir = state.getVersionDir()

        return install.start()
        .then(() => {
          expect(unzip.start).to.be.calledWithMatch({
            zipFilePath: filename,
            installDir,
          })
        })
      })

      it('can install local binary zip file without download from absolute path', function () {
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
          state.getBinaryPkgAsync.resolves({ version: packageVersion })
        })

        it('doesn\'t attempt to download', function () {
          return install.start()
          .then(() => {
            expect(download.start).not.to.be.called
            expect(state.getBinaryPkgAsync).to.be.calledWith('/cache/Cypress/1.2.3/Cypress.app')
          })
        })

        it('logs \'skipping install\' when explicit cypress install', function () {
          return install.start()
          .then(() => {
            return snapshot(
              'version already installed - cypress install 1',
              normalize(this.stdout.toString()),
            )
          })
        })

        it('logs when already installed when run from postInstall', function () {
          util.isPostInstall.returns(true)

          return install.start()
          .then(() => {
            snapshot(
              'version already installed - postInstall 1',
              normalize(this.stdout.toString()),
            )
          })
        })
      })

      describe('when getting installed version fails', function () {
        beforeEach(function () {
          state.getBinaryPkgAsync.resolves(null)

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
            'continues installing on failure 1',
            normalize(this.stdout.toString()),
          )
        })
      })

      describe('when there is no install version', function () {
        beforeEach(function () {
          state.getBinaryPkgAsync.resolves(null)

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
            downloadDestination,
          )

          snapshot(
            'installs without existing installation 1',
            normalize(this.stdout.toString()),
          )
        })
      })

      describe('when getting installed version does not match needed version', function () {
        beforeEach(function () {
          state.getBinaryPkgAsync.resolves({ version: 'x.x.x' })

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
            'installed version does not match needed version 1',
            normalize(this.stdout.toString()),
          )
        })
      })

      describe('with force: true', function () {
        beforeEach(function () {
          state.getBinaryPkgAsync.resolves({ version: packageVersion })

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
            'forcing true always installs 1',
            normalize(this.stdout.toString()),
          )
        })
      })

      describe('as a global install', function () {
        beforeEach(function () {
          sinon.stub(util, 'isInstalledGlobally').returns(true)

          state.getBinaryPkgAsync.resolves({ version: 'x.x.x' })

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
            'warning installing as global 1',
            normalize(this.stdout.toString()),
          )
        })
      })

      describe('when running in CI', function () {
        beforeEach(function () {
          util.isCi.returns(true)

          state.getBinaryPkgAsync.resolves({ version: 'x.x.x' })

          return install.start()
        })

        it('uses verbose renderer', function () {
          snapshot(
            'installing in ci 1',
            normalize(this.stdout.toString()),
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
              'invalid cache directory 1',
              normalize(this.stdout.toString()),
            )
          })
        })
      })

      describe('CYPRESS_INSTALL_BINARY is URL or Zip', function () {
        it('uses cache when correct version installed given URL', function () {
          state.getBinaryPkgAsync.resolves({ version: '1.2.3' })
          util.pkgVersion.returns('1.2.3')
          process.env.CYPRESS_INSTALL_BINARY = 'www.cypress.io/cannot-download/2.4.5'

          return install.start()
          .then(() => {
            expect(download.start).to.not.be.called
          })
        })

        it('uses cache when mismatch version given URL ', function () {
          state.getBinaryPkgAsync.resolves({ version: '1.2.3' })
          util.pkgVersion.returns('4.0.0')
          process.env.CYPRESS_INSTALL_BINARY = 'www.cypress.io/cannot-download/2.4.5'

          return install.start()
          .then(() => {
            expect(download.start).to.not.be.called
          })
        })

        it('uses cache when correct version installed given Zip', function () {
          sinon.stub(fs, 'pathExistsAsync').withArgs('/path/to/zip.zip').resolves(true)

          state.getBinaryPkgAsync.resolves({ version: '1.2.3' })
          util.pkgVersion.returns('1.2.3')

          process.env.CYPRESS_INSTALL_BINARY = '/path/to/zip.zip'

          return install.start()
          .then(() => {
            expect(unzip.start).to.not.be.called
          })
        })

        it('uses cache when mismatch version given Zip ', function () {
          sinon.stub(fs, 'pathExistsAsync').withArgs('/path/to/zip.zip').resolves(true)

          state.getBinaryPkgAsync.resolves({ version: '1.2.3' })
          util.pkgVersion.returns('4.0.0')
          process.env.CYPRESS_INSTALL_BINARY = '/path/to/zip.zip'

          return install.start()
          .then(() => {
            expect(unzip.start).to.not.be.called
          })
        })
      })
    })

    it('is silent when log level is silent', function () {
      process.env.npm_config_loglevel = 'silent'

      return install.start()
      .then(() => {
        return snapshot(
          'silent install 1',
          normalize(`[no output]${this.stdout.toString()}`),
        )
      })
    })

    it('exits with error when installing on unsupported os', function () {
      sinon.stub(util, 'getPlatformInfo').resolves('Platform: win32-ia32')

      return install.start()
      .then(() => {
        throw new Error('should have caught error')
      })
      .catch((err) => {
        logger.error(err)

        snapshot(
          'error when installing on unsupported os',
          normalize(this.stdout.toString()),
        )
      })
    })
  })

  context('._getBinaryUrlFromBuildInfo', function () {
    const buildInfo = {
      commitSha: 'abc123',
      commitBranch: 'aBranchName',
    }

    it('generates the expected URL', () => {
      os.platform.returns('linux')

      expect(install._getBinaryUrlFromBuildInfo('x64', buildInfo))
      .to.eq(`https://cdn.cypress.io/beta/binary/0.0.0-development/linux-x64/aBranchName-abc123/cypress.zip`)
    })
  })
})
