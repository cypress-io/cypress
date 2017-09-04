require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const path = require('path')
const EE = require('events').EventEmitter
const cp = require('child_process')
const clearModule = require('clear-module')
const snapshot = require('snap-shot-it')

const fs = require(`${lib}/fs`)
const logger = require(`${lib}/logger`)
const utils = require(`${lib}/tasks/verify`)
const xvfb = require(`${lib}/exec/xvfb`)
const packageVersion = require(`${lib}/util`).pkgVersion()

const distDir = path.join(__dirname, '../../dist')
const infoFilePath = path.join(distDir, 'info.json')

describe('utils', function () {
  beforeEach(function () {
    logger.reset()

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
        this.sandbox.stub(process.env, 'CI')
        // force recomputing CI flag
        clearModule('is-ci')
        clearModule('ci-info')
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
        delete process.env.CI
        snapshot(logger.print())
      })

      it('prints message on completing the mock bar', function () {
        process.env.CI = '1'
        const bar = utils.getProgressBar('test bar', barOptions)
        bar.tick()
        bar.tick()
        bar.tick()
        delete process.env.CI
        snapshot(logger.print())
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

  context('#getPathToUserExecutableDir', function () {
    it('resolves path on macOS', function () {
      this.sandbox.stub(os, 'platform').returns('darwin')
      expect(utils.getPathToUserExecutableDir()).to.equal(path.join(distDir, 'Cypress.app'))
    })

    it('resolves path on linux', function () {
      this.sandbox.stub(os, 'platform').returns('linux')
      expect(utils.getPathToUserExecutableDir()).to.equal(path.join(distDir, 'Cypress'))
    })

    it('rejects on anything else', function () {
      this.sandbox.stub(os, 'platform').returns('win32')
      expect(() => utils.getPathToUserExecutableDir()).to.throw('Platform: "win32" is not supported.')
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
        snapshot(logger.print())
        expect(process.exit).to.be.calledWith(1)
      })
    })

    it('logs warning when installed version does not match package version', function () {
      return utils.writeInstalledVersion('bloop')
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        snapshot(logger.print())
      })
    })

    it('logs error and exits when executable cannot be found', function () {
      this.sandbox.stub(fs, 'statAsync').rejects()

      return utils.writeInstalledVersion(packageVersion)
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        snapshot(logger.print())
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
        return utils.verify({ force: true })
        .then(() => {
          snapshot(logger.print())
        })
      })

      it('runs smoke test even if version already verified', function () {
        return utils.verify({ force: true })
        .then(() => {
          snapshot(logger.print())
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
          snapshot(logger.print())
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
          snapshot(logger.print())
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
          snapshot(logger.print())
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
          snapshot(logger.print())
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
            snapshot(logger.print())
          })
        })
      })
    })
  })
})
