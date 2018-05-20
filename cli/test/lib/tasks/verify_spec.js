require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const EE = require('events').EventEmitter
const Promise = require('bluebird')
const snapshot = require('snap-shot-it')
const { stripIndent } = require('common-tags')

const fs = require(`${lib}/fs`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const xvfb = require(`${lib}/exec/xvfb`)
const state = require(`${lib}/tasks/state`)
const verify = require(`${lib}/tasks/verify`)

const stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')

const packageVersion = '1.2.3'
const executablePath = '/cache/Cypress/1.2.3/Cypress.app/executable'
const binaryDir = '/cache/Cypress/1.2.3/Cypress.app'


const slice = (str) => {
  // strip answer and split by new lines
  str = str.split('\n')

  // find the line about verifying cypress can run
  const index = _.findIndex(str, (line) => {
    return line.includes('Verifying Cypress can run')
  })

  // get rid of whatever the next line is because
  // i cannot figure out why this line fails in CI
  // its likely due to some UTF code
  str.splice(index + 1, 1, 'STRIPPED')

  return str.join('\n')
}

context('lib/tasks/verify', function () {
  require('mocha-banner').register()

  beforeEach(function () {
    this.stdout = stdout.capture()
    this.cpstderr = sinon.stub(new EE())
    this.cpstderr.on.returns(undefined)
    this.cpstdout = sinon.stub(new EE())
    this.cpstdout.on.returns(undefined)

    sinon.stub(util, 'isCi').returns(false)
    sinon.stub(util, 'pkgVersion').returns(packageVersion)
    os.platform.returns('darwin')
    this.spawnedProcess = _.extend(new EE(), {
      on: sinon.stub(),
      unref: sinon.stub(),
      stderr: this.cpstderr,
      stdout: this.cpstdout,
    })
    this.spawnedProcess.on.withArgs('error')
    this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

    sinon.stub(cp, 'spawn').returns(this.spawnedProcess)
    sinon.stub(state, 'getPathToExecutable').returns(executablePath)
    sinon.stub(state, 'getBinaryDir').returns(binaryDir)
    sinon.stub(xvfb, 'start').resolves()
    sinon.stub(xvfb, 'stop').resolves()
    sinon.stub(xvfb, 'isNeeded').returns(false)
    sinon.stub(Promise.prototype, 'delay').resolves()
    sinon.stub(state, 'writeBinaryVerifiedAsync').resolves()
    sinon.stub(state, 'clearBinaryStateAsync').resolves()
    sinon.stub(fs, 'realpathAsync')
  })

  afterEach(function () {
    stdout.restore()
  })

  it('logs error and exits when no version of Cypress is installed', function () {
    const ctx = this
    sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(false)
    return verify.start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err) => {
      logger.error(err)

      snapshot(
        'no version of Cypress installed',
        normalize(ctx.stdout.toString())
      )
    })
  })

  it('is noop when binary is already verified', function () {
    const ctx = this

    // make it think the executable exists and is verified
    sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
    sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)
    sinon.stub(state, 'getBinaryVerifiedAsync').resolves(true)
    return verify.start()
    .then(() => {
      // nothing should have been logged to stdout
      // since no verification took place
      expect(ctx.stdout.toString()).to.be.empty

      expect(cp.spawn).not.to.be.called
    })
  })

  it('logs warning when installed version does not match verified version', function () {
    const ctx = this
    sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
    sinon.stub(state, 'getBinaryPkgVersionAsync').resolves('bloop')
    // force this to throw to short circuit actually running smoke test
    sinon.stub(state, 'getBinaryVerifiedAsync').rejects(new Error())

    return verify.start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch(() => {
      snapshot(
        'warning installed version does not match verified version',
        normalize(ctx.stdout.toString())
      )
    })
  })

  it('logs error and exits when executable cannot be found', function () {
    const ctx = this
    sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)

    return verify.start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err) => {
      logger.error(err)

      snapshot(
        'executable cannot be found',
        normalize(ctx.stdout.toString())
      )
    })
  })

  describe('with force: true', function () {
    beforeEach(function () {
      sinon.stub(_, 'random').returns('222')
      this.cpstdout.on.yieldsAsync('222')
    })

    it('shows full path to executable when verifying', function () {
      const ctx = this

      sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)
      sinon.stub(state, 'getBinaryVerifiedAsync').resolves(false)

      return verify.start({ force: true })
      .then(() => {
        expect(cp.spawn).to.be.calledWith(executablePath, [
          '--smoke-test',
          '--ping=222',
        ])
      })
      .then(() => {
        snapshot(
          'verification with executable',
          normalize(ctx.stdout.toString())
        )
      })
    })

    it('clears verified version from state if verification fails', function () {
      const ctx = this
      const stderr = 'an error about dependencies'

      sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)
      sinon.stub(state, 'getBinaryVerifiedAsync').resolves(true)

      this.cpstderr.on.withArgs('data').yields(stderr)
      this.spawnedProcess.on.withArgs('close').yieldsAsync(1)

      return verify.start({ force: true })
      .catch((err) => {
        logger.error(err)

        snapshot(
          'fails verifying Cypress',
          normalize(slice(ctx.stdout.toString()))
        )
      })
      .then(() => {
        expect(state.clearBinaryStateAsync).to.be.called
        expect(state.writeBinaryVerifiedAsync).to.not.be.called
      })
    })
  })

  describe('smoke test with DEBUG output', function () {
    beforeEach(function () {
      sinon.stub(fs, 'statAsync').resolves()
      sinon.stub(_, 'random').returns('222')
      const stdoutWithDebugOutput = stripIndent`
        some debug output
        date: more debug output
        222
        after that more text
      `
      this.cpstdout.on.yieldsAsync(stdoutWithDebugOutput)
    })

    it('finds ping value in the verbose output', function () {
      const ctx = this
      sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)
      sinon.stub(state, 'getBinaryVerifiedAsync').resolves(false)

      return verify.start()
      .then(() => {
        snapshot(
          'verbose stdout output',
          normalize(ctx.stdout.toString())
        )
      })
    })
  })

  describe('smoke test', function () {
    beforeEach(function () {
      sinon.stub(fs, 'statAsync').resolves()
      sinon.stub(_, 'random').returns('222')
      this.cpstdout.on.yieldsAsync('222')
    })

    it('logs and runs when no version has been verified', function () {
      const ctx = this
      sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)
      sinon.stub(state, 'getBinaryVerifiedAsync').resolves(false)

      return verify.start()
      .then(() => {
        snapshot(
          'no existing version verified',
          normalize(ctx.stdout.toString())
        )
      })
    })

    it('logs and runs when current version has not been verified', function () {
      const ctx = this
      sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves('different version')
      sinon.stub(state, 'getBinaryVerifiedAsync').resolves(false)
      return verify.start()
      .then(() => {
        snapshot(
          'current version has not been verified',
          normalize(ctx.stdout.toString())
        )
      })
    })

    it('logs and runs when installed version is different than verified version', function () {
      const ctx = this
      sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves('9.8.7')
      sinon.stub(state, 'getBinaryVerifiedAsync').resolves(false)

      return verify.start()
      .then(() => {
        snapshot(
          'current version has not been verified',
          normalize(ctx.stdout.toString())
        )
      })
    })

    it('turns off Opening Cypress...', function () {
      const ctx = this
      sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves('different version')
      sinon.stub(state, 'getBinaryVerifiedAsync').resolves(true)

      return verify.start({
        welcomeMessage: false,
      })
      .then(() => {
        snapshot(
          'no welcome message',
          normalize(ctx.stdout.toString())
        )
      })
    })

    describe('on linux', function () {
      beforeEach(function () {
        xvfb.isNeeded.returns(true)
        sinon.stub(fs, 'pathExistsAsync').withArgs(executablePath).resolves(true)
        sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)
        sinon.stub(state, 'getBinaryVerifiedAsync').resolves(false)
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
        const ctx = this

        const err = new Error('test without xvfb')
        err.stack = 'xvfb? no dice'
        xvfb.start.rejects(err)
        return verify.start()
        .catch((err) => {
          expect(xvfb.stop).to.be.calledOnce

          logger.error(err)

          snapshot(
            'xvfb fails',
            normalize(slice(ctx.stdout.toString()))
          )
        })
      })
    })

    describe('when running in CI', function () {
      beforeEach(function () {
        sinon.stub(fs, 'pathExistsAsync').resolves(true)
        sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)
        sinon.stub(state, 'getBinaryVerifiedAsync').resolves(false)
        util.isCi.returns(true)

        return verify.start({ force: true })
      })

      it('uses verbose renderer', function () {
        snapshot(
          'verifying in ci',
          normalize(this.stdout.toString())
        )
      })
    })

    describe('when env var CYPRESS_RUN_BINARY', function () {
      beforeEach(function () {
        xvfb.isNeeded.returns(true)
        sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(packageVersion)
        sinon.stub(state, 'getBinaryVerifiedAsync').resolves(false)
        sinon.stub(util, 'isExecutableAsync').resolves(true)
      })

      it('can validate and use executable', function () {
        const envBinaryPath = '/custom/Contents/MacOS/Cypress'
        const realEnvBinaryPath = `/real${envBinaryPath}`

        fs.realpathAsync.resolves(realEnvBinaryPath)
        state.getPathToExecutable.restore()

        sinon.stub(state, 'getPathToExecutable')
        .withArgs('/real/custom')
        .returns(realEnvBinaryPath)

        sinon.stub(fs, 'pathExistsAsync')
        .withArgs(realEnvBinaryPath)
        .resolves(true)

        process.env.CYPRESS_RUN_BINARY = envBinaryPath
        return verify.start()
        .then(() => {
          expect(cp.spawn.firstCall.args[0]).to.equal(realEnvBinaryPath)
          snapshot('valid CYPRESS_RUN_BINARY', normalize(this.stdout.toString()))
        })
      })


      ;['darwin', 'linux', 'win32'].forEach((platform) => it('can log error to user', function () {
        os.platform.returns(platform)
        const envBinaryPath = '/custom/'
        const realEnvBinaryPath = `/real${envBinaryPath}`

        fs.realpathAsync.resolves(realEnvBinaryPath)
        state.getPathToExecutable.restore()

        process.env.CYPRESS_RUN_BINARY = envBinaryPath
        return verify.start()
        .then(() => { throw new Error('Should have thrown') })
        .catch((err) => {
          logger.error(err)
          snapshot(
            `${platform}: error when invalid CYPRESS_RUN_BINARY`,
            normalize(this.stdout.toString())
          )
        })


      }))
    })
  })
})
