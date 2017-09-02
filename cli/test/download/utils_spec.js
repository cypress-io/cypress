require('../spec_helper')

const _ = require('lodash')
const os = require('os')
const chalk = require('chalk')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const EE = require('events').EventEmitter
const cp = require('child_process')
const clearModule = require('clear-module')

const packageVersion = require('../../package').version
const utils = require('../../lib/download/utils')
const xvfb = require('../../lib/exec/xvfb')

const distDir = path.join(__dirname, '../../dist')
const infoFilePath = path.join(distDir, 'info.json')

describe('utils', function () {
  const verifyingMessage = chalk.yellow('⧖ Verifying Cypress executable...')

  beforeEach(function () {
    this.sandbox.stub(process, 'exit')
    this.ensureEmptyInstallationDir = () => {
      return fs.removeAsync(distDir).then(() => {
        return utils.ensureInstallationDir()
      })
    }
  })

  afterEach(function () {
    return fs.removeAsync(distDir)
  })

  context('#getProgressBar', function () {
    const barOptions = {
      total: 3,
      width: 10,
    }

    it('makes valid progress bar', function () {
      const bar = utils.getProgressBar('test bar', barOptions)
      expect(bar.curr).to.equal(0)
      bar.tick()
      bar.tick()
      bar.tick()
      expect(bar.curr).to.equal(3)
      expect(bar.complete).to.be.true
    })

    describe('mock bar', function () {
      beforeEach(function saveCI () {
        this.ciFlag = process.env.CI
        // force recomputing CI flag
        clearModule('is-ci')
        clearModule('ci-info')
        this.console = this.sandbox.spy(console, 'log')
      })

      afterEach(function restoreCI () {
        process.env.CI = this.ciFlag
      })

      it('makes valid mock progress bar', function () {
        process.env.CI = '1'
        const bar = utils.getProgressBar('test bar', barOptions)
        expect(bar.mock).to.be.true
        expect(bar.curr).to.equal(0)
        bar.tick()
        bar.tick()
        bar.tick()
        expect(bar.curr).to.equal(3)
        expect(bar.complete).to.be.true
      })

      it('prints title in mock bar', function () {
        process.env.CI = '1'
        utils.getProgressBar('test bar', barOptions)
        const logged = this.console.firstCall.args.join()
        expect(logged).to.include('test bar')
      })

      it('prints message on completing the mock bar', function () {
        process.env.CI = '1'
        const bar = utils.getProgressBar('test bar', barOptions)
        bar.tick()
        bar.tick()
        bar.tick()
        const logged = this.console.lastCall.args.join()
        expect(logged).to.include('finished')
      })
    })
  })

  context('#clearVersionState', function () {
    it('wipes out version info in info.json', function () {
      return fs.outputJsonAsync(infoFilePath, { version: '5', verifiedVersion: '5', other: 'info' })
      .then(() => {
        return utils.clearVersionState()
      })
      .then(() => {
        return fs.readJsonAsync(infoFilePath)
      })
      .then((contents) => {
        expect(contents).to.eql({ other: 'info' })
      })
    })
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
      expect(() => utils.getPathToUserExecutable()).to.throw('Platform: "win32" is not supported.')
    })
  })

  context('#writeInstalledVersion', function () {
    beforeEach(function () {
      return this.ensureEmptyInstallationDir()
    })

    it('writes the version to the version file', function () {
      return utils.writeInstalledVersion('the version')
      .then(() => {
        return fs.readJsonAsync(infoFilePath).get('version')
      })
      .then((version) => {
        expect(version).to.equal('the version')
      })
    })
  })

  context('#verify', function () {
    beforeEach(function () {
      this.log = this.sandbox.spy(console, 'log')
      this.sandbox.stub(os, 'platform').returns('darwin')
      this.stdout = new EE()
      this.spawnedProcess = _.extend(new EE(), {
        unref: this.sandbox.stub(),
        stderr: new EE(),
        stdout: this.stdout,
      })
      this.sandbox.stub(cp, 'spawn').returns(this.spawnedProcess)
      this.sandbox.stub(xvfb, 'start').resolves()
      this.sandbox.stub(xvfb, 'stop').resolves()
      this.sandbox.stub(xvfb, 'isNeeded').returns(false)
      this.sandbox.stub(this.spawnedProcess, 'on')
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      return this.ensureEmptyInstallationDir()
    })

    it('logs error and exits when no version of Cypress is installed', function () {
      return fs.outputJsonAsync(infoFilePath, {})
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        expect(this.log).to.be.calledWith('No version of Cypress executable installed')
        expect(process.exit).to.be.calledWith(1)
      })
    })

    it('logs warning when installed version does not match package version', function () {
      return utils.writeInstalledVersion('bloop')
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        const warning = chalk.yellow('! Installed version (bloop) does not match package version (0.0.0)')
        expect(this.log).to.be.calledWith(warning)
      })
    })

    it('logs error and exits when executable cannot be found', function () {
      this.sandbox.stub(fs, 'statAsync').rejects()

      return utils.writeInstalledVersion(packageVersion)
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        expect(this.log).to.be.calledWith('Cypress executable not found at')
        expect(process.exit).to.be.calledWith(1)
      })
    })

    describe('with force: true', function () {
      beforeEach(function () {
        this.sandbox.stub(fs, 'statAsync').resolves()
        this.sandbox.stub(_, 'random').returns('222')
        this.sandbox.stub(this.stdout, 'on').yieldsAsync('222')
        return fs.outputJsonAsync(infoFilePath, { version: packageVersion, verifiedVersion: packageVersion })
      })

      it('shows full path to executable when verifying', function () {
        const executable = utils.getPathToExecutable()
        const message1 = chalk.green('✓ Cypress executable found at:')
        const message2 = chalk.cyan(executable)
        return utils.verify({ force: true })
        .then(() => {
          expect(this.log).to.be.calledWith(message1, message2)
        })
      })

      it('runs smoke test even if version already verified', function () {
        return utils.verify({ force: true })
        .then(() => {
          expect(this.log).to.be.calledWith(verifyingMessage)
          expect(cp.spawn).to.be.calledWith(utils.getPathToExecutable(), [
            '--smoke-test',
            '--ping=222',
          ])
        })
      })

      it('clears verified version from state if verification fails', function () {
        this.spawnedProcess.on.withArgs('close').yieldsAsync(1)
        return utils.verify({ force: true })
        .then(() => {
          return fs.readJsonAsync(infoFilePath).get('verifiedVersion')
        })
        .then((verifiedVersion) => {
          expect(verifiedVersion).to.be.null
        })
      })
    })

    describe('smoke test', function () {
      beforeEach(function () {
        this.sandbox.stub(fs, 'statAsync').resolves()
        this.sandbox.stub(_, 'random').returns('222')
        this.sandbox.stub(this.stdout, 'on').yieldsAsync('222')
      })

      it('logs and runs when no version has been verified', function () {
        return utils.writeInstalledVersion(packageVersion)
        .then(() => {
          return utils.verify()
        })
        .then(() => {
          expect(this.log).to.be.calledWith(verifyingMessage)
          expect(cp.spawn).to.be.calledWith(utils.getPathToExecutable(), [
            '--smoke-test',
            '--ping=222',
          ])
        })
      })

      it('logs and runs when current version has not been verified', function () {
        return fs.outputJsonAsync(path.join(utils.getInstallationDir(), 'info.json'), {
          version: packageVersion,
          verifiedVersion: 'different version',
        })
        .then(() => {
          return utils.verify()
        })
        .then(() => {
          expect(this.log).to.be.calledWith(verifyingMessage)
          expect(cp.spawn).to.be.calledWith(utils.getPathToExecutable(), [
            '--smoke-test',
            '--ping=222',
          ])
        })
      })

      it('logs stderr when it fails', function () {
        this.sandbox.stub(this.spawnedProcess.stderr, 'on')
        this.spawnedProcess.stderr.on.withArgs('data').yields({
          toString: () => 'the stderr output',
        })
        this.spawnedProcess.on.withArgs('close').yieldsAsync(1)

        return fs.outputJsonAsync(infoFilePath, {
          version: packageVersion,
          verifiedVersion: 'different version',
        })
        .then(() => {
          return utils.verify()
        })
        .then(() => {
          expect(this.log).to.be.calledWith(chalk.red('✖ Failed to verify Cypress executable.'))
          expect(this.log).to.be.calledWith('the stderr output')
        })
      })

      it('logs success message and writes version when it succeeds', function () {
        return fs.outputJsonAsync(infoFilePath, {
          version: packageVersion,
          verifiedVersion: 'different version',
        })
        .then(() => {
          return utils.verify()
        })
        .then(() => {
          return fs.readJsonAsync(infoFilePath)
        })
        .then((info) => {
          expect(this.log).to.be.calledWith(chalk.green('✓ Successfully verified Cypress executable'))
          expect(info.verifiedVersion).to.equal(packageVersion)
        })
      })

      describe('on linux', function () {
        beforeEach(function () {
          xvfb.isNeeded.returns(true)

          return fs.outputJsonAsync(infoFilePath, {
            version: packageVersion,
            verifiedVersion: 'different version',
          })
        })

        it('starts xvfb', function () {
          return utils.verify()
          .then(() => {
            expect(xvfb.start).to.be.called
          })
        })

        it('stops xvfb on spawned process close', function () {
          this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
          return utils.verify()
          .then(() => {
            expect(xvfb.stop).to.be.called
          })
        })

        it('logs error and exits when starting xvfb fails', function () {
          const err = new Error('test without xvfb')
          err.stack = 'xvfb? no dice'
          xvfb.start.rejects(err)
          return utils.verify()
          .then(() => {
            expect(this.log).to.be.calledWith('Looks like your system is missing a must have dependency: XVFB')
          })
        })
      })
    })
  })
})
