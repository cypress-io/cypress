require('../spec_helper')

const _ = require('lodash')
const os = require('os')
const chalk = require('chalk')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const EE = require('events').EventEmitter
const cp = require('child_process')

const packageVersion = require('../../package').version
const utils = require('../../lib/download/utils')
const xvfb = require('../../lib/exec/xvfb')

const distDir = path.join(__dirname, '../../lib/download/dist')

describe('utils', function () {
  beforeEach(function () {
    this.ensureEmptyInstallationDir = () => {
      return fs.removeAsync(distDir).then(() => {
        return utils.ensureInstallationDir()
      })
    }
  })

  context('#ensureInstallationDir', function () {
    beforeEach(function () {
      return fs.removeAsync(distDir)
    })

    it('ensures directory exists', function () {
      return utils.ensureInstallationDir().then(() => {
        return fs.statAsync(distDir)
      })
    })
  })

  context('#getInstallationDir', function () {
    it('resolves path to installation directory', function () {
      expect(utils.getInstallationDir()).to.equal(distDir)
    })
  })

  context('#getInstalledVersion', function () {
    beforeEach(function () {
      return this.ensureEmptyInstallationDir()
    })

    it('resolves version from version file when it exists', function () {
      return utils.writeInstalledVersion('2.0.48')
      .then(() => {
        return utils.getInstalledVersion()
      })
      .then((version) => {
        expect(version).to.equal('2.0.48')
      })
    })

    it('throws when version file does not exist', function () {
      return utils.getInstalledVersion()
      .catch(() => {})
    })
  })

  context('#getPathToUserExecutable', function () {
    it('resolves path on macOS', function () {
      this.sandbox.stub(os, 'platform').returns('darwin')
      expect(utils.getPathToUserExecutable()).to.equal(path.join(distDir, 'Cypress.app'))
    })

    it('resolves path on linux', function () {
      this.sandbox.stub(os, 'platform').returns('linux')
      expect(utils.getPathToUserExecutable()).to.equal(path.join(distDir, 'Cypress'))
    })

    it('rejects on anything else', function () {
      this.sandbox.stub(os, 'platform').returns('win32')
      expect(() => utils.getPathToUserExecutable()).to.throw(`Platform: 'win32' is not supported.`)
    })
  })

  context('#writeInstalledVersion', function () {
    beforeEach(function () {
      return this.ensureEmptyInstallationDir()
    })

    it('writes the version to the version file', function () {
      return utils.writeInstalledVersion('the version')
      .then(() => {
        return fs.readJsonAsync(path.join(distDir, 'info.json')).get('version')
      })
      .then((version) => {
        expect(version).to.equal('the version')
      })
    })
  })

  context('#verify', function () {
    beforeEach(function () {
      this.log = this.sandbox.spy(console, 'log')
      this.sandbox.stub(process, 'exit')
      this.spawnedProcess = _.extend(new EE(), {
        unref: this.sandbox.stub(),
        stderr: new EE(),
      })
      this.sandbox.stub(cp, 'spawn').returns(this.spawnedProcess)
      this.sandbox.stub(xvfb, 'start').resolves()
      this.sandbox.stub(xvfb, 'stop').resolves()
      this.sandbox.stub(xvfb, 'isNeeded').returns(true)
      return this.ensureEmptyInstallationDir()
    })

    it('logs error and exits when no version of Cypress is installed', function () {
      return utils.verify().then(() => {
        expect(this.log).to.be.calledWith(chalk.red('No version of Cypress executable installed. Run `cypress install` and try again.'))
        expect(process.exit).to.be.calledWith(1)
      })
    })

    it('logs error and exits when installed version does not match package version', function () {
      return utils.writeInstalledVersion('bloop')
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        expect(this.log).to.be.calledWith(chalk.red(`Installed version (bloop) does not match package version (${packageVersion}). Run \`cypress install\` and try again.`))
        expect(process.exit).to.be.calledWith(1)
      })
    })

    it('logs error and exits when executable cannot be found', function () {
      this.sandbox.stub(fs, 'statAsync').rejects()

      return utils.writeInstalledVersion(packageVersion)
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        expect(this.log).to.be.calledWith(chalk.red('Cypress executable not found. Run `cypress install` and try again.'))
        expect(process.exit).to.be.calledWith(1)
      })
    })

    describe('smoke test', function () {
      beforeEach(function () {
        this.sandbox.stub(fs, 'statAsync').resolves()
        this.sandbox.stub(this.spawnedProcess, 'on')
        this.spawnedProcess.on.withArgs('exit').yieldsAsync(0)
      })

      it('logs and runs when no version has been verified', function () {
        return utils.writeInstalledVersion(packageVersion)
        .then(() => {
          return utils.verify()
        })
        .then(() => {
          expect(this.log).to.be.calledWith(chalk.yellow('Verifying Cypress executable...'))
          expect(cp.spawn).to.be.calledWith(utils.getPathToExecutable(), ['--project', path.join(distDir, '../project')])
        })
      })

      it('logs and runs when current version has not been verified', function () {
        return fs.outputJsonAsync(path.join(utils.getInstallationDir(), 'info.json'), {
          version: packageVersion,
          verifiedVersion: "different version",
        })
        .then(() => {
          return utils.verify()
        })
        .then(() => {
          expect(this.log).to.be.calledWith(chalk.yellow('Verifying Cypress executable...'))
          expect(cp.spawn).to.be.calledWith(utils.getPathToExecutable(), ['--project', path.join(__dirname, '../../lib/download/project')])
        })
      })

      it('logs stderr when it fails', function () {
        this.sandbox.stub(this.spawnedProcess.stderr, 'on')
        this.spawnedProcess.stderr.on.withArgs('data').yields({
          toString: () => 'the stderr output',
        })
        this.spawnedProcess.on.withArgs('exit').yieldsAsync(1)

        return fs.outputJsonAsync(path.join(distDir, 'info.json'), {
          version: packageVersion,
          verifiedVersion: "different version",
        })
        .then(() => {
          return utils.verify()
        })
        .then(() => {
          expect(this.log).to.be.calledWith(chalk.red('Failed to verify Cypress executable.'))
          expect(this.log).to.be.calledWith('the stderr output')
        })
      })

      it('logs success message and writes version when it succeeds', function () {
        return fs.outputJsonAsync(path.join(distDir, 'info.json'), {
          version: packageVersion,
          verifiedVersion: "different version",
        })
        .then(() => {
          return utils.verify()
        })
        .then(() => {
          return fs.readJsonAsync(path.join(distDir, 'info.json'))
        })
        .then((info) => {
          expect(this.log).to.be.calledWith(chalk.green('✓ Verified Cypress executable'))
          expect(info.verifiedVersion).to.equal(packageVersion)
        })
      })

      describe.only('on linux', function () {
        beforeEach(function () {
          xvfb.isNeeded.returns(true)

          return fs.outputJsonAsync(path.join(distDir, 'info.json'), {
            version: packageVersion,
            verifiedVersion: "different version",
          })
        })

        it('starts xvfb', function () {
          return utils.verify()
          .then(() => {
            expect(xvfb.start).to.be.called
          })
        })

        it('stops xvfb on spawned process close', function () {
          this.spawnedProcess.on.withArgs('close').yieldsAsync()
          return utils.verify()
          .then(() => {
            expect(xvfb.stop).to.be.called
          })
        })

        it('logs error and exits when starting xvfb fails', function () {
          const err = new Error('')
          err.stack = 'xvfb? no dice'
          xvfb.start.rejects(err)
          return utils.verify()
          .then(() => {
            expect(this.log).to.be.calledWith('Could not start XVFB. Make sure it is installed on your system.\n\nxvfb? no dice')
          })
        })
      })
    })
  })
})
