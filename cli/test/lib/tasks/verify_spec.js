require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const EE = require('events').EventEmitter
const path = require('path')
const Promise = require('bluebird')
const snapshot = require('snap-shot-it')

const fs = require(`${lib}/fs`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const xvfb = require(`${lib}/exec/xvfb`)
const info = require(`${lib}/tasks/info`)
const verify = require(`${lib}/tasks/verify`)

const stdout = require('../../support/stdout')

const packageVersion = '1.2.3'
const executablePath = '/path/to/executable'
const installationDir = info.getInstallationDir()
const infoFilePath = info.getInfoFilePath()

context('.verify', function () {
  beforeEach(function () {
    this.stdout = stdout.capture()
    this.io = new EE()
    this.sandbox.stub(os, 'platform').returns('darwin')
    this.sandbox.stub(os, 'release').returns('test release')
    this.ensureEmptyInstallationDir = () => {
      return fs.removeAsync(installationDir)
      .then(() => {
        return info.ensureInstallationDir()
      })
    }
    this.spawnedProcess = _.extend(new EE(), {
      unref: this.sandbox.stub(),
      stderr: new EE(),
      stdout: this.io,
    })
    this.sandbox.stub(cp, 'spawn').returns(this.spawnedProcess)
    this.sandbox.stub(util, 'pkgVersion').returns(packageVersion)
    this.sandbox.stub(info, 'getPathToExecutable').returns(executablePath)
    this.sandbox.stub(xvfb, 'start').resolves()
    this.sandbox.stub(xvfb, 'stop').resolves()
    this.sandbox.stub(xvfb, 'isNeeded').returns(false)
    this.sandbox.stub(Promise, 'delay').resolves()
    this.sandbox.stub(this.spawnedProcess, 'on')
    this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
    return this.ensureEmptyInstallationDir()
  })

  afterEach(function () {
    stdout.restore()
  })

  it('logs error and exits when no version of Cypress is installed', function () {
    const ctx = this

    return info.writeInfoFileContents({})
    .then(() => {
      return verify.start()
    })
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err) => {
      logger.error(err)

      snapshot(ctx.stdout.toString())
    })
  })

  it('logs warning when installed version does not match package version', function () {
    const ctx = this

    this.sandbox.stub(fs, 'statAsync')
    .callThrough()
    .withArgs(executablePath)
    .resolves()

    // force this to throw to short circuit actually running smoke test
    this.sandbox.stub(info, 'getVerifiedVersion').rejects(new Error)

    return info.writeInstalledVersion('bloop')
    .then(() => {
      return verify.start()
    })
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch(() => {
      snapshot(ctx.stdout.toString())
    })
  })

  it('logs error and exits when executable cannot be found', function () {
    const ctx = this

    return info.writeInstalledVersion(packageVersion)
    .then(() => {
      return verify.start()
    })
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err) => {
      logger.error(err)

      snapshot(ctx.stdout.toString())
    })
  })

  describe('with force: true', function () {
    beforeEach(function () {
      this.sandbox.stub(fs, 'statAsync').resolves()
      this.sandbox.stub(_, 'random').returns('222')
      this.sandbox.stub(this.io, 'on').yieldsAsync('222')
      return fs.outputJsonAsync(infoFilePath, { version: packageVersion, verifiedVersion: packageVersion })
    })

    it('shows full path to executable when verifying', function () {
      return verify.start({ force: true })
      .then(() => {
        snapshot(logger.print())
      })
    })

    it('runs smoke test even if version already verified', function () {
      return verify.start({ force: true })
      .then(() => {
        snapshot(logger.print())
        expect(cp.spawn).to.be.calledWith(info.getPathToExecutable(), [
          '--smoke-test',
          '--ping=222',
        ])
      })
    })

    it('clears verified version from state if verification fails', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(1)
      return verify.start({ force: true })
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
      this.sandbox.stub(this.io, 'on').yieldsAsync('222')
    })

    it('logs and runs when no version has been verified', function () {
      return info.writeInstalledVersion(packageVersion)
      .then(() => {
        return verify.start()
      })
      .then(() => {
        snapshot(logger.print())
        expect(cp.spawn).to.be.calledWith(info.getPathToExecutable(), [
          '--smoke-test',
          '--ping=222',
        ])
      })
    })

    it('logs and runs when current version has not been verified', function () {
      return fs.outputJsonAsync(path.join(info.getInstallationDir(), 'info.json'), {
        version: packageVersion,
        verifiedVersion: 'different version',
      })
      .then(() => {
        return verify.start()
      })
      .then(() => {
        snapshot(logger.print())
        expect(cp.spawn).to.be.calledWith(info.getPathToExecutable(), [
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
        return verify.start()
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
        return verify.start()
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
        return verify.start()
        .then(() => {
          expect(xvfb.start).to.be.called
        })
      })

      it('stops xvfb on spawned process close', function () {
        this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
        return verify.start()
        .then(() => {
          expect(xvfb.stop).to.be.called
        })
      })

      it('logs error and exits when starting xvfb fails', function () {
        const err = new Error('test without xvfb')
        err.stack = 'xvfb? no dice'
        xvfb.start.rejects(err)
        return verify.start()
        .then(() => {
          snapshot(logger.print())
        })
      })
    })
  })
})
