/* eslint-disable no-restricted-properties */
require('../../spec_helper')

const path = require('path')
const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const Promise = require('bluebird')
const { stripIndent } = require('common-tags')

const mockfs = require('mock-fs')
const mockedEnv = require('mocked-env')

const fs = require(`${lib}/fs`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const xvfb = require(`${lib}/exec/xvfb`)
const verify = require(`${lib}/tasks/verify`)

const Stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')
const snapshot = require('../../support/snapshot')
const { mockSpawn } = require('../../support/spawn-mock')

const packageVersion = '1.2.3'
const cacheDir = '/cache/Cypress'
const executablePath = '/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress'
const binaryStatePath = '/cache/Cypress/1.2.3/binary_state.json'
const DEFAULT_VERIFY_TIMEOUT = 30000

let stdout
let spawnedProcess

/* eslint-disable no-octal */

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
    os.release.returns('0.0.0')

    sinon.stub(util, 'getCacheDir').returns(cacheDir)
    sinon.stub(util, 'isCi').returns(false)
    sinon.stub(util, 'pkgVersion').returns(packageVersion)
    sinon.stub(util, 'exec')

    sinon.stub(xvfb, 'start').resolves()
    sinon.stub(xvfb, 'stop').resolves()
    sinon.stub(xvfb, 'isNeeded').returns(false)
    sinon.stub(Promise.prototype, 'delay').resolves()
    sinon.stub(process, 'geteuid').returns(1000)

    sinon.stub(_, 'random').returns('222')

    util.exec
    .withArgs(executablePath, ['--no-sandbox', '--smoke-test', '--ping=222'])
    .resolves(spawnedProcess)
  })

  afterEach(() => {
    Stdout.restore()
  })

  it('has verify task timeout', () => {
    expect(verify.VERIFY_TEST_RUNNER_TIMEOUT_MS).to.eql(DEFAULT_VERIFY_TIMEOUT)
  })

  it('accepts custom verify task timeout', () => {
    process.env.CYPRESS_VERIFY_TIMEOUT = '500000'
    delete require.cache[require.resolve(`${lib}/tasks/verify`)]
    const newVerifyInstance = require(`${lib}/tasks/verify`)

    expect(newVerifyInstance.VERIFY_TEST_RUNNER_TIMEOUT_MS).to.eql(500000)
  })

  it('accepts custom verify task timeout from npm', () => {
    process.env.npm_config_CYPRESS_VERIFY_TIMEOUT = '500000'
    delete require.cache[require.resolve(`${lib}/tasks/verify`)]
    const newVerifyInstance = require(`${lib}/tasks/verify`)

    expect(newVerifyInstance.VERIFY_TEST_RUNNER_TIMEOUT_MS).to.eql(500000)
  })

  it('falls back to default verify task timeout if custom value is invalid', () => {
    process.env.CYPRESS_VERIFY_TIMEOUT = 'foobar'
    delete require.cache[require.resolve(`${lib}/tasks/verify`)]
    const newVerifyInstance = require(`${lib}/tasks/verify`)

    expect(newVerifyInstance.VERIFY_TEST_RUNNER_TIMEOUT_MS).to.eql(DEFAULT_VERIFY_TIMEOUT)
  })

  it('logs error and exits when no version of Cypress is installed', () => {
    return verify
    .start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err) => {
      logger.error(err)

      snapshot(
        'no version of Cypress installed 1',
        normalize(stdout.toString()),
      )
    })
  })

  it('adds --no-sandbox when user is root', () => {
    // make it think the executable exists
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    process.geteuid.returns(0) // user is root
    util.exec.resolves({
      stdout: '222',
      stderr: '',
    })

    return verify.start()
    .then(() => {
      expect(util.exec).to.be.calledWith(executablePath, ['--no-sandbox', '--smoke-test', '--ping=222'])
    })
  })

  it('adds --no-sandbox when user is non-root', () => {
    // make it think the executable exists
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    process.geteuid.returns(1000) // user is non-root
    util.exec.resolves({
      stdout: '222',
      stderr: '',
    })

    return verify.start()
    .then(() => {
      expect(util.exec).to.be.calledWith(executablePath, ['--no-sandbox', '--smoke-test', '--ping=222'])
    })
  })

  it('is noop when binary is already verified', () => {
    // make it think the executable exists and is verified
    createfs({
      alreadyVerified: true,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    return verify.start().then(() => {
      // nothing should have been logged to stdout
      // since no verification took place
      expect(stdout.toString()).to.be.empty

      expect(util.exec).not.to.be.called
    })
  })

  it('logs warning when installed version does not match verified version', () => {
    createfs({
      alreadyVerified: true,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion: 'bloop',
    })

    return verify
    .start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch(() => {
      return snapshot(
        'warning installed version does not match verified version 1',
        normalize(stdout.toString()),
      )
    })
  })

  it('logs error and exits when executable cannot be found', () => {
    return verify
    .start()
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err) => {
      logger.error(err)

      snapshot('executable cannot be found 1', normalize(stdout.toString()))
    })
  })

  it('logs error when child process hangs', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    sinon.stub(cp, 'spawn').withArgs('/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress').callsFake(mockSpawn((cp) => {
      cp.stderr.write('some stderr')
      cp.stdout.write('some stdout')
    }))

    util.exec.restore()

    return verify
    .start({ smokeTestTimeout: 1 })
    .catch((err) => {
      logger.error(err)
    })
    .then(() => {
      snapshot(normalize(slice(stdout.toString())))
    })
  })

  it('logs error when child process returns incorrect stdout (stderr when exists)', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    sinon.stub(cp, 'spawn').callsFake(mockSpawn((cp) => {
      cp.stderr.write('some stderr')
      cp.stdout.write('some stdout')
      cp.emit('exit', 0, null)
      cp.end()
    }))

    util.exec.restore()

    return verify
    .start()
    .catch((err) => {
      logger.error(err)
    })
    .then(() => {
      snapshot(normalize(slice(stdout.toString())))
    })
  })

  it('logs error when child process returns incorrect stdout (stdout when no stderr)', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    sinon.stub(cp, 'spawn').callsFake(mockSpawn((cp) => {
      cp.stdout.write('some stdout')
      cp.emit('exit', 0, null)
      cp.end()
    }))

    util.exec.restore()

    return verify
    .start()
    .catch((err) => {
      logger.error(err)
    })
    .then(() => {
      snapshot(normalize(slice(stdout.toString())))
    })
  })

  it('sets ELECTRON_ENABLE_LOGGING without mutating process.env', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    expect(process.env.ELECTRON_ENABLE_LOGGING).to.be.undefined

    util.exec.resolves()
    sinon.stub(util, 'stdoutLineMatches').returns(true)

    return verify
    .start()
    .then(() => {
      expect(process.env.ELECTRON_ENABLE_LOGGING).to.be.undefined

      const stdioOptions = util.exec.firstCall.args[2]

      expect(stdioOptions).to.include({
        timeout: verify.VERIFY_TEST_RUNNER_TIMEOUT_MS,
      })

      expect(stdioOptions.env).to.include({
        ELECTRON_ENABLE_LOGGING: true,
      })
    })
  })

  describe('with force: true', () => {
    beforeEach(() => {
      createfs({
        alreadyVerified: true,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })
    })

    it('shows full path to executable when verifying', () => {
      return verify.start({ force: true }).then(() => {
        snapshot('verification with executable 1', normalize(stdout.toString()))
      })
    })

    it('clears verified version from state if verification fails', () => {
      util.exec.restore()
      sinon
      .stub(util, 'exec')
      .withArgs(executablePath)
      .rejects({
        code: 1,
        stderr: 'an error about dependencies',
      })

      return verify
      .start({ force: true })
      .then(() => {
        throw new Error('Should have thrown')
      })
      .catch((err) => {
        logger.error(err)
      })
      .then(() => {
        return fs.pathExistsAsync(binaryStatePath)
      })
      .then((exists) => {
        return expect(exists).to.eq(false)
      })
      .then(() => {
        return snapshot(
          'fails verifying Cypress 1',
          normalize(slice(stdout.toString())),
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
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })
    })

    it('finds ping value in the verbose output', () => {
      return verify.start().then(() => {
        snapshot('verbose stdout output 1', normalize(stdout.toString()))
      })
    })
  })

  describe('smoke test retries on bad display with our Xvfb', () => {
    let restore

    beforeEach(() => {
      restore = mockedEnv({
        DISPLAY: 'test-display',
      })

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      util.exec.restore()
      sinon.spy(logger, 'warn')
    })

    afterEach(() => {
      restore()
    })

    it('successfully retries with our Xvfb on Linux', () => {
      // initially we think the user has everything set
      xvfb.isNeeded.returns(false)
      sinon.stub(util, 'isPossibleLinuxWithIncorrectDisplay').returns(true)

      sinon.stub(util, 'exec').callsFake(() => {
        const firstSpawnError = new Error('')

        // this message contains typical Gtk error shown if X11 is incorrect
        // like in the case of DISPLAY=987
        firstSpawnError.stderr = stripIndent`
          [some noise here] Gtk: cannot open display: 987
            and maybe a few other lines here with weird indent
        `

        firstSpawnError.stdout = ''

        // the second time the binary returns expected ping
        util.exec.withArgs(executablePath).resolves({
          stdout: '222',
        })

        return Promise.reject(firstSpawnError)
      })

      return verify.start().then(() => {
        expect(util.exec).to.have.been.calledTwice
        // user should have been warned
        expect(logger.warn).to.have.been.calledWithMatch(
          'This is likely due to a misconfigured DISPLAY environment variable.',
        )
      })
    })

    it('fails on both retries with our Xvfb on Linux', () => {
      // initially we think the user has everything set
      xvfb.isNeeded.returns(false)

      sinon.stub(util, 'isPossibleLinuxWithIncorrectDisplay').returns(true)

      sinon.stub(util, 'exec').callsFake(() => {
        os.platform.returns('linux')
        expect(xvfb.start).to.not.have.been.called

        const firstSpawnError = new Error('')

        // this message contains typical Gtk error shown if X11 is incorrect
        // like in the case of DISPLAY=987
        firstSpawnError.stderr = stripIndent`
          [some noise here] Gtk: cannot open display: 987
            and maybe a few other lines here with weird indent
        `

        firstSpawnError.stdout = ''

        // the second time it runs, it fails for some other reason
        const secondMessage = stripIndent`
          [some noise here] Gtk: cannot open display: 987
          some other error
            again with
              some weird indent
        `

        util.exec.withArgs(executablePath).rejects(new Error(secondMessage))

        return Promise.reject(firstSpawnError)
      })

      return verify.start().then(() => {
        throw new Error('Should have failed')
      })
      .catch((e) => {
        expect(util.exec).to.have.been.calledTwice
        // second time around we should have called Xvfb
        expect(xvfb.start).to.have.been.calledOnce
        expect(xvfb.stop).to.have.been.calledOnce

        // user should have been warned
        expect(logger.warn).to.have.been.calledWithMatch('DISPLAY was set to: "test-display"')

        snapshot('tried to verify twice, on the first try got the DISPLAY error', e.message)
      })
    })
  })

  it('logs an error if Cypress executable does not exist', () => {
    createfs({
      alreadyVerified: false,
      executable: false,
      packageVersion,
    })

    return verify
    .start()
    .then(() => {
      throw new Error('Should have thrown')
    })
    .catch((err) => {
      stdout = Stdout.capture()
      logger.error(err)

      return snapshot('no Cypress executable 1', normalize(stdout.toString()))
    })
  })

  it('logs an error if Cypress executable does not have permissions', () => {
    mockfs.restore()
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o666 }),
      packageVersion,
    })

    return verify
    .start()
    .then(() => {
      throw new Error('Should have thrown')
    })
    .catch((err) => {
      stdout = Stdout.capture()
      logger.error(err)

      return snapshot(
        'Cypress non-executable permissions 1',
        normalize(stdout.toString()),
      )
    })
  })

  it('logs and runs when current version has not been verified', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    return verify.start().then(() => {
      return snapshot(
        'current version has not been verified 1',
        normalize(stdout.toString()),
      )
    })
  })

  it('logs and runs when installed version is different than package version', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion: '7.8.9',
    })

    return verify.start().then(() => {
      return snapshot(
        'different version installed 1',
        normalize(stdout.toString()),
      )
    })
  })

  it('is silent when logLevel is silent', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    process.env.npm_config_loglevel = 'silent'

    return verify.start().then(() => {
      return snapshot(
        'silent verify 1',
        normalize(`[no output]${stdout.toString()}`),
      )
    })
  })

  it('turns off Opening Cypress...', () => {
    createfs({
      alreadyVerified: true,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion: '7.8.9',
    })

    return verify
    .start({
      welcomeMessage: false,
    })
    .then(() => {
      return snapshot('no welcome message 1', normalize(stdout.toString()))
    })
  })

  it('logs error when fails smoke test unexpectedly without stderr', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    util.exec.restore()
    sinon.stub(util, 'exec').rejects({
      stderr: '',
      stdout: '',
      message: 'Error: EPERM NOT PERMITTED',
    })

    return verify
    .start()
    .then(() => {
      throw new Error('Should have thrown')
    })
    .catch((err) => {
      stdout = Stdout.capture()
      logger.error(err)

      return snapshot('fails with no stderr 1', normalize(stdout.toString()))
    })
  })

  describe('on linux', () => {
    beforeEach(() => {
      xvfb.isNeeded.returns(true)

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })
    })

    it('starts xvfb', () => {
      return verify.start().then(() => {
        expect(xvfb.start).to.be.called
      })
    })

    it('stops xvfb on spawned process close', () => {
      return verify.start().then(() => {
        expect(xvfb.stop).to.be.called
      })
    })

    it('logs error and exits when starting xvfb fails', () => {
      const err = new Error('test without xvfb')

      xvfb.start.restore()

      err.nonZeroExitCode = true
      err.stack = 'xvfb? no dice'
      sinon.stub(xvfb._xvfb, 'startAsync').rejects(err)

      return verify.start()
      .then(() => {
        throw new Error('should have thrown')
      })
      .catch((err) => {
        expect(xvfb.stop).to.be.calledOnce

        logger.error(err)

        snapshot('xvfb fails 1', normalize(slice(stdout.toString())))
      })
    })
  })

  describe('when running in CI', () => {
    beforeEach(() => {
      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      util.isCi.returns(true)
    })

    it('uses verbose renderer', () => {
      return verify.start().then(() => {
        snapshot('verifying in ci 1', normalize(stdout.toString()))
      })
    })

    it('logs error when binary not found', () => {
      mockfs({})

      return verify
      .start()
      .then(() => {
        throw new Error('Should have thrown')
      })
      .catch((err) => {
        logger.error(err)
        snapshot('error binary not found in ci 1', normalize(stdout.toString()))
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
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
        customDir: '/real/custom',
      })

      util.exec
      .withArgs(realEnvBinaryPath, ['--no-sandbox', '--smoke-test', '--ping=222'])
      .resolves(spawnedProcess)

      return verify.start().then(() => {
        expect(util.exec.firstCall.args[0]).to.equal(realEnvBinaryPath)
        snapshot('valid CYPRESS_RUN_BINARY 1', normalize(stdout.toString()))
      })
    })

    _.each(['darwin', 'linux', 'win32'], (platform) => {
      return it('can log error to user', () => {
        process.env.CYPRESS_RUN_BINARY = '/custom/'
        os.platform.returns(platform)

        return verify
        .start()
        .then(() => {
          throw new Error('Should have thrown')
        })
        .catch((err) => {
          logger.error(err)
          snapshot(
            `${platform}: error when invalid CYPRESS_RUN_BINARY 1`,
            normalize(stdout.toString()),
          )
        })
      })
    })
  })

  // tests for when Electron needs "--no-sandbox" CLI flag
  context('.needsSandbox', () => {
    it('needs --no-sandbox on Linux as a root', () => {
      os.platform.returns('linux')
      process.geteuid.returns(0) // user is root
      expect(verify.needsSandbox()).to.be.true
    })

    it('needs --no-sandbox on Linux as a non-root', () => {
      os.platform.returns('linux')
      process.geteuid.returns(1000) // user is non-root
      expect(verify.needsSandbox()).to.be.true
    })

    it('needs --no-sandbox on Mac as a non-root', () => {
      os.platform.returns('darwin')
      process.geteuid.returns(1000) // user is non-root
      expect(verify.needsSandbox()).to.be.true
    })

    it('does not need --no-sandbox on Windows', () => {
      os.platform.returns('win32')
      expect(verify.needsSandbox()).to.be.false
    })
  })
})

// TODO this needs documentation with examples badly.
function createfs ({ alreadyVerified, executable, packageVersion, customDir }) {
  if (!customDir) {
    customDir = '/cache/Cypress/1.2.3/Cypress.app'
  }

  // binary state is stored one folder higher than the runner itself
  // see https://github.com/cypress-io/cypress/issues/6089
  const binaryStateFolder = path.join(customDir, '..')

  const binaryState = {
    verified: alreadyVerified,
  }
  const binaryStateText = JSON.stringify(binaryState)

  let mockFiles = {
    [binaryStateFolder]: {
      'binary_state.json': binaryStateText,
    },
    [customDir]: {
      Contents: {
        MacOS: executable
          ? {
            Cypress: executable,
          }
          : {},
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
      mode: 0o777,
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
