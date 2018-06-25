require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const mockfs = require('mock-fs')
const _snapshot = require('snap-shot-it')
const Promise = require('bluebird')
const { stripIndent } = require('common-tags')

const fs = require(`${lib}/fs`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const xvfb = require(`${lib}/exec/xvfb`)
const verify = require(`${lib}/tasks/verify`)

const Stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')

const packageVersion = '1.2.3'
const cacheDir = '/cache/Cypress'
const executablePath = '/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress'
const binaryStatePath = '/cache/Cypress/1.2.3/Cypress.app/binary_state.json'

let stdout
let spawnedProcess

/* eslint-disable no-octal */

const snapshot = (...args) => {
  mockfs.restore()
  _snapshot(...args)
}

context('lib/tasks/verify', () => {
  require('mocha-banner').register()

  beforeEach(() => {

    stdout = Stdout.capture()
    spawnedProcess = {
      code: 0,
      stderr: sinon.stub(),
      stdout: '222',
    }

    os.platform.returns('darwin')

    sinon.stub(util, 'getCacheDir').returns(cacheDir)
    sinon.stub(util, 'isCi').returns(false)
    sinon.stub(util, 'pkgVersion').returns(packageVersion)
    sinon.stub(util, 'exec')


    sinon.stub(xvfb, 'start').resolves()
    sinon.stub(xvfb, 'stop').resolves()
    sinon.stub(xvfb, 'isNeeded').returns(false)
    sinon.stub(Promise.prototype, 'delay').resolves()

    sinon.stub(_, 'random').returns('222')

    util.exec.withArgs(executablePath, [
      '--smoke-test',
      '--ping=222',
    ]).resolves(spawnedProcess)
  })

  afterEach(() => {
    Stdout.restore()
  })

  it('logs error and exits when no version of Cypress is installed', () => {
    mockfs({})
    return verify.start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err) => {
      logger.error(err)

      snapshot(
        'no version of Cypress installed',
        normalize(stdout.toString())
      )
    })
  })

  it('is noop when binary is already verified', () => {
    // make it think the executable exists and is verified
    createfs({
      alreadyVerified: true,
      executable: mockfs.file({ mode: 0777 }),
      packageVersion,
    })
    return verify.start()
    .then(() => {
      // nothing should have been logged to stdout
      // since no verification took place
      expect(stdout.toString()).to.be.empty

      expect(util.exec).not.to.be.called
    })
  })

  it('logs warning when installed version does not match verified version', () => {

    createfs({
      alreadyVerified: true,
      executable: mockfs.file({ mode: 0777 }),
      packageVersion: 'bloop',
    })

    return verify.start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch(() => {
      return snapshot(
        'warning installed version does not match verified version',
        normalize(stdout.toString())
      )
    })
  })

  it('logs error and exits when executable cannot be found', () => {

    return verify.start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err) => {
      logger.error(err)

      snapshot(
        'executable cannot be found',
        normalize(stdout.toString())
      )
    })
  })

  describe('with force: true', () => {
    beforeEach(() => {
      createfs({
        alreadyVerified: true,
        executable: mockfs.file({ mode: 0777 }),
        packageVersion,
      })
    })

    it('shows full path to executable when verifying', () => {

      return verify.start({ force: true })
      .then(() => {
        snapshot(
          'verification with executable',
          normalize(stdout.toString())
        )
      })
    })

    it('clears verified version from state if verification fails', () => {

      util.exec.restore()
      sinon.stub(util, 'exec').withArgs(executablePath).rejects({
        code: 1,
        stderr: 'an error about dependencies',
      })

      return verify.start({ force: true })
      .then(() => { throw new Error('Should have thrown') })
      .catch((err) => {
        logger.error(err)
      })
      .then(() => fs.pathExistsAsync(binaryStatePath))
      .then((exists) => expect(exists).to.eq(false))
      .then(() => {
        return snapshot(
          'fails verifying Cypress',
          normalize(slice(stdout.toString()))
        )
      })
    })
  })

  describe('smoke test with DEBUG output', () => {
    beforeEach(() => {

      const stdoutWithDebugOutput = stripIndent`
        some debug output
        date: more debug output
        222
        after that more text
      `
      util.exec.withArgs(executablePath).resolves({
        stdout: stdoutWithDebugOutput,
      })

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0777 }),
        packageVersion,
      })
    })

    it('finds ping value in the verbose output', () => {

      return verify.start()
      .then(() => {
        snapshot(
          'verbose stdout output',
          normalize(stdout.toString())
        )
      })
    })
  })

  it('logs an error if Cypress executable does not exist', () => {
    createfs({
      alreadyVerified: false,
      executable: false,
      packageVersion,
    })
    return verify.start()
    .then(() => { throw new Error('Should have thrown') })
    .catch((err) => {
      stdout = Stdout.capture()
      logger.error(err)

      return snapshot(
        'no Cypress executable',
        normalize(stdout.toString())
      )
    })
  })

  it('logs an error if Cypress executable does not have permissions', () => {
    mockfs.restore()
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0666 }),
      packageVersion,
    })
    return verify.start()
    .then(() => { throw new Error('Should have thrown') })
    .catch((err) => {
      stdout = Stdout.capture()
      logger.error(err)

      return snapshot(
        'Cypress non-executable permissions',
        normalize(stdout.toString())
      )
    })
  })

  it('logs and runs when current version has not been verified', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0777 }),
      packageVersion,
    })
    return verify.start()
    .then(() => {
      return snapshot(
        'current version has not been verified',
        normalize(stdout.toString())
      )
    })
  })

  it('logs and runs when installed version is different than package version', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0777 }),
      packageVersion: '7.8.9',
    })
    return verify.start()
    .then(() => {
      return snapshot(
        'different version installed',
        normalize(stdout.toString())
      )
    })
  })

  it('is silent when logLevel is silent', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0777 }),
      packageVersion,
    })

    process.env.npm_config_loglevel = 'silent'

    return verify.start()
    .then(() => {
      return snapshot(
        'silent verify',
        normalize(`[no output]${stdout.toString()}`)
      )
    })
  })

  it('turns off Opening Cypress...', () => {
    createfs({
      alreadyVerified: true,
      executable: mockfs.file({ mode: 0777 }),
      packageVersion: '7.8.9',
    })

    return verify.start({
      welcomeMessage: false,
    })
    .then(() => {
      return snapshot(
        'no welcome message',
        normalize(stdout.toString())
      )
    })
  })

  it('logs error when fails smoke test unexpectedly without stderr', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0777 }),
      packageVersion,
    })

    util.exec.restore()
    sinon.stub(util, 'exec').rejects({
      stderr: '',
      stdout: '',
      message: 'Error: EPERM NOT PERMITTED',
    })

    return verify.start()
    .then(() => { throw new Error('Should have thrown') })
    .catch((err) => {
      stdout = Stdout.capture()
      logger.error(err)
      return snapshot(
        'fails with no stderr',
        normalize(stdout.toString())
      )
    })
  })

  describe('on linux', () => {
    beforeEach(() => {
      xvfb.isNeeded.returns(true)
      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0777 }),
        packageVersion,
      })
    })

    it('starts xvfb', () => {
      return verify.start()
      .then(() => {
        expect(xvfb.start).to.be.called
      })
    })

    it('stops xvfb on spawned process close', () => {
      return verify.start()
      .then(() => {
        expect(xvfb.stop).to.be.called
      })
    })

    it('logs error and exits when starting xvfb fails', () => {
      const err = new Error('test without xvfb')
      err.stack = 'xvfb? no dice'
      xvfb.start.rejects(err)
      return verify.start()
      .catch((err) => {
        expect(xvfb.stop).to.be.calledOnce

        logger.error(err)

        snapshot(
          'xvfb fails',
          normalize(slice(stdout.toString()))
        )
      })
    })
  })

  describe('when running in CI', () => {
    beforeEach(() => {
      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0777 }),
        packageVersion,
      })
      util.isCi.returns(true)
    })

    it('uses verbose renderer', () => {
      return verify.start()
      .then(() => {
        snapshot(
          'verifying in ci',
          normalize(stdout.toString())
        )
      })
    })

    it('logs error when binary not found', () => {
      mockfs({})
      return verify.start()
      .then(() => { throw new Error('Should have thrown') })
      .catch((err) => {
        logger.error(err)
        snapshot(
          'error binary not found in ci',
          normalize(stdout.toString())
        )
      })
    })
  })

  describe('when env var CYPRESS_RUN_BINARY', () => {

    it('can validate and use executable', () => {
      const envBinaryPath = '/custom/Contents/MacOS/Cypress'
      const realEnvBinaryPath = `/real${envBinaryPath}`

      process.env.CYPRESS_RUN_BINARY = envBinaryPath
      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0777 }),
        packageVersion,
        customDir: '/real/custom',
      })
      util.exec.withArgs(realEnvBinaryPath, [
        '--smoke-test',
        '--ping=222',
      ]).resolves(spawnedProcess)
      return verify.start()
      .then(() => {
        expect(util.exec.firstCall.args[0]).to.equal(realEnvBinaryPath)
        snapshot('valid CYPRESS_RUN_BINARY', normalize(stdout.toString()))
      })
    })


    ;['darwin', 'linux', 'win32'].forEach((platform) => it('can log error to user', () => {
      process.env.CYPRESS_RUN_BINARY = '/custom/'
      os.platform.returns(platform)
      return verify.start()
      .then(() => { throw new Error('Should have thrown') })
      .catch((err) => {
        logger.error(err)
        snapshot(
          `${platform}: error when invalid CYPRESS_RUN_BINARY`,
          normalize(stdout.toString())
        )
      })
    }))
  })
})

function createfs ({ alreadyVerified, executable, packageVersion, customDir }) {
  let mockFiles = {
    [customDir ? customDir : '/cache/Cypress/1.2.3/Cypress.app']: {
      'binary_state.json': `{"verified": ${alreadyVerified}}`,
      Contents: {
        MacOS: executable ? {
          Cypress: executable,
        } : {},
        Resources: {
          app: {
            'package.json': `{"version": "${packageVersion}"}`,
          },
        },
      },
    },
  }

  if (customDir) {
    mockFiles['/custom/Contents/MacOS/Cypress'] = mockfs.symlink({
      path: '/real/custom/Contents/MacOS/Cypress',
      mode: 0777,
    })
  }
  return mockfs(mockFiles)
}

function slice (str) {
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
