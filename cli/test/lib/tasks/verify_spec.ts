/* eslint-disable no-restricted-properties */
import '../../spec_helper'
import path from 'path'
import _ from 'lodash'
import os from 'os'
import cp from 'child_process'
import BluebirdPromise from 'bluebird'
import { stripIndent } from 'common-tags'
import mockfs from 'mock-fs'
import mockedEnv from 'mocked-env'
import Stdout from '../../support/stdout'
import normalize from '../../support/normalize'
import snapshot from '../../support/snapshot'
import mockSpawnModule from '../../support/spawn-mock'

import fs from '../../../lib/fs'
import util from '../../../lib/util'
import logger from '../../../lib/logger'
import xvfb from '../../../lib/exec/xvfb'
import verify from '../../../lib/tasks/verify'

const packageVersion = '1.2.3'
const cacheDir = '/cache/Cypress'
const executablePath = '/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress'
const binaryStatePath = '/cache/Cypress/1.2.3/binary_state.json'
const DEFAULT_VERIFY_TIMEOUT = 30000

let stdout: any
let spawnedProcess: any

/* eslint-disable no-octal */

context('lib/tasks/verify', () => {
  before(async function () {
    const mochaMain = await import('mocha-banner')

    mochaMain.register()
  })

  beforeEach(() => {
    stdout = Stdout.capture()
    spawnedProcess = {
      code: 0,
      stderr: sinon.stub(),
      stdout: '222',
    }

    ;(os.platform as any).returns('darwin')

    ;(os.release as any).returns('0.0.0')

    sinon.stub(util, 'getCacheDir').returns(cacheDir)
    sinon.stub(util, 'isCi').returns(false)
    sinon.stub(util, 'pkgVersion').returns(packageVersion)
    sinon.stub(util, 'exec')

    sinon.stub(xvfb, 'start').resolves()
    sinon.stub(xvfb, 'stop').resolves()
    sinon.stub(xvfb, 'isNeeded').returns(false)
    sinon.stub(BluebirdPromise.prototype, 'delay').resolves()
    sinon.stub(process, 'geteuid').returns(1000)

    sinon.stub(_, 'random').returns(222)

    util.exec
    // @ts-expect-error - is a sinon stub
    .withArgs(executablePath, ['--no-sandbox', '--smoke-test', '--ping=222'])
    .resolves(spawnedProcess)
  })

  afterEach(() => {
    Stdout.restore()
  })

  it('has verify task timeout', () => {
    expect(verify.VERIFY_TEST_RUNNER_TIMEOUT_MS).to.eql(DEFAULT_VERIFY_TIMEOUT)
  })

  it('accepts custom verify task timeout', async () => {
    process.env.CYPRESS_VERIFY_TIMEOUT = '500000'
    const proxyquire = await import('proxyquire')
    const newVerifyInstance = proxyquire.default(`../../../lib/tasks/verify`, {}).default

    expect(newVerifyInstance.VERIFY_TEST_RUNNER_TIMEOUT_MS).to.eql(500000)
  })

  it('accepts custom verify task timeout from npm', async () => {
    process.env.npm_config_CYPRESS_VERIFY_TIMEOUT = '500000'
    const proxyquire = await import('proxyquire')
    const newVerifyInstance = proxyquire.default(`../../../lib/tasks/verify`, {}).default

    expect(newVerifyInstance.VERIFY_TEST_RUNNER_TIMEOUT_MS).to.eql(500000)
  })

  it('falls back to default verify task timeout if custom value is invalid', async () => {
    process.env.CYPRESS_VERIFY_TIMEOUT = 'foobar'

    const proxyquire = await import('proxyquire')
    const newVerifyInstance = proxyquire.default(`../../../lib/tasks/verify`, {}).default

    expect(newVerifyInstance.VERIFY_TEST_RUNNER_TIMEOUT_MS).to.eql(DEFAULT_VERIFY_TIMEOUT)
  })

  it('returns early when `CYPRESS_SKIP_VERIFY` is set to true', async () => {
    process.env.CYPRESS_SKIP_VERIFY = 'true'

    const proxyquire = await import('proxyquire')
    const newVerifyInstance = proxyquire.default(`../../../lib/tasks/verify`, {}).default

    return newVerifyInstance.start({ listrRenderer: 'silent' }).then((result: any) => {
      expect(result).to.eq(undefined)
    })
  })

  it('logs error and exits when no version of Cypress is installed', () => {
    return verify
    .start({ listrRenderer: 'silent' })
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err: any) => {
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

    ;(process.geteuid as any).returns(0) // user is root
    // @ts-expect-error - is a sinon stub
    util.exec.resolves({
      stdout: '222',
      stderr: '',
    })

    return verify.start({ listrRenderer: 'silent' })
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

    ;(process.geteuid as any).returns(1000) // user is non-root
    // @ts-expect-error - is a sinon stub
    util.exec.resolves({
      stdout: '222',
      stderr: '',
    })

    return verify.start({ listrRenderer: 'silent' })
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

    return verify.start({ listrRenderer: 'silent' }).then(() => {
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
    .start({ listrRenderer: 'silent' })
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
    .start({ listrRenderer: 'silent' })
    .then(() => {
      throw new Error('should have caught error')
    })
    .catch((err: any) => {
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

    // @ts-expect-error - invalid number of arguments for given type
    sinon.stub(cp, 'spawn').withArgs('/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress').callsFake(mockSpawnModule.mockSpawn((cp: any) => {
      cp.stderr.write('some stderr')
      cp.stdout.write('some stdout')
    }))

    // @ts-expect-error - is a sinon stub
    util.exec.restore()

    return verify
    .start({ smokeTestTimeout: 1, listrRenderer: 'silent' })
    .catch((err: any) => {
      logger.error(err)
    })
    .then(() => {
      snapshot(normalize(stdout.toString()))
    })
  })

  it('logs error when child process returns incorrect stdout (stderr when exists)', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    sinon.stub(cp, 'spawn').callsFake(mockSpawnModule.mockSpawn((cp: any) => {
      cp.stderr.write('some stderr')
      cp.stdout.write('some stdout')
      cp.emit('exit', 0, null)
      cp.end()
    }))

    // @ts-expect-error - is a sinon stub
    util.exec.restore()

    return verify
    .start({ listrRenderer: 'silent' })
    .catch((err: any) => {
      logger.error(err)
    })
    .then(() => {
      snapshot(normalize(stdout.toString()))
    })
  })

  it('logs error when child process returns incorrect stdout (stdout when no stderr)', () => {
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    sinon.stub(cp, 'spawn').callsFake(mockSpawnModule.mockSpawn((cp: any) => {
      cp.stdout.write('some stdout')
      cp.emit('exit', 0, null)
      cp.end()
    }))

    // @ts-expect-error - is a sinon stub
    util.exec.restore()

    return verify
    .start({ listrRenderer: 'silent' })
    .catch((err: any) => {
      logger.error(err)
    })
    .then(() => {
      snapshot(normalize(stdout.toString()))
    })
  })

  describe('FORCE_COLOR', () => {
    let previousForceColors: any

    beforeEach(() => {
      previousForceColors = process.env.FORCE_COLOR

      process.env.FORCE_COLOR = 'true' as any
    })

    afterEach(() => {
      process.env.FORCE_COLOR = previousForceColors
    })

    // @see https://github.com/cypress-io/cypress/issues/28982
    it('sets FORCE_COLOR to 0 when piping stdioOptions to to the smoke test to avoid ANSI in binary smoke test', () => {
      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      // @ts-expect-error - is a sinon stub
      util.exec.resolves({
        stdout: '222',
        stderr: '',
      })

      return verify.start({ listrRenderer: 'silent' })
      .then(() => {
        expect(util.exec).to.be.calledWith(executablePath, ['--no-sandbox', '--smoke-test', '--ping=222'],
          sinon.match({
            env: {
              FORCE_COLOR: '0',
            },
          }))
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
      return verify.start({ force: true, listrRenderer: 'silent' }).then(() => {
        snapshot('verification with executable 1', normalize(stdout.toString()))
      })
    })

    it('clears verified version from state if verification fails', () => {
    // @ts-expect-error - is a sinon stub
      util.exec.restore()
      sinon
      .stub(util, 'exec')
      .withArgs(executablePath)
      .rejects({
        code: 1,
        stderr: 'an error about dependencies',
      })

      return verify
      .start({ force: true, listrRenderer: 'silent' })
      .then(() => {
        throw new Error('Should have thrown')
      })
      .catch((err: any) => {
        logger.error(err)
      })
      .then(() => {
        return fs.pathExistsAsync(binaryStatePath)
      })
      .then((exists: any) => {
        return expect(exists).to.eq(false)
      })
      .then(() => {
        return snapshot(
          'fails verifying Cypress 1',
          normalize(stdout.toString()),
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

      // @ts-expect-error - is a sinon stub
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
      return verify.start({ listrRenderer: 'silent' }).then(() => {
        snapshot('verbose stdout output 1', normalize(stdout.toString()))
      })
    })
  })

  describe('smoke test retries on bad display with our Xvfb', () => {
    let restore: any

    beforeEach(() => {
      restore = mockedEnv({
        DISPLAY: 'test-display',
      })

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      // @ts-expect-error - is a sinon stub
      util.exec.restore()
      sinon.spy(logger, 'warn')
    })

    afterEach(() => {
      restore()
    })

    it('successfully retries with our Xvfb on Linux', () => {
      // initially we think the user has everything set
      // @ts-expect-error - is a sinon stub
      xvfb.isNeeded.returns(false)
      sinon.stub(util, 'isPossibleLinuxWithIncorrectDisplay').returns(true)

      // @ts-expect-error - is a sinon stub
      sinon.stub(util, 'exec').callsFake(() => {
        const firstSpawnError: any = new Error('')

        // this message contains typical Gtk error shown if X11 is incorrect
        // like in the case of DISPLAY=987
        firstSpawnError.stderr = stripIndent`
          [some noise here] Gtk: cannot open display: 987
            and maybe a few other lines here with weird indent
        `

        firstSpawnError.stdout = ''

        // the second time the binary returns expected ping
        // @ts-expect-error - is a sinon stub
        util.exec.withArgs(executablePath).resolves({
          stdout: '222',
        })

        return BluebirdPromise.reject(firstSpawnError)
      })

      return verify.start({ listrRenderer: 'silent' }).then(() => {
        expect(util.exec).to.have.been.calledTwice
        // user should have been warned
        expect(logger.warn).to.have.been.calledWithMatch(
          'This is likely due to a misconfigured DISPLAY environment variable.',
        )
      })
    })

    it('fails on both retries with our Xvfb on Linux', () => {
      // initially we think the user has everything set
      // @ts-expect-error - is a sinon stub
      xvfb.isNeeded.returns(false)

      sinon.stub(util, 'isPossibleLinuxWithIncorrectDisplay').returns(true)

      // @ts-expect-error - is a sinon stub
      sinon.stub(util, 'exec').callsFake(() => {
        (os.platform as any).returns('linux')
        expect(xvfb.start).to.not.have.been.called

        const firstSpawnError: any = new Error('')

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

        // @ts-expect-error - is a sinon stub
        util.exec.withArgs(executablePath).rejects(new Error(secondMessage))

        return BluebirdPromise.reject(firstSpawnError)
      })

      return verify.start({ listrRenderer: 'silent' }).then(() => {
        throw new Error('Should have failed')
      })
      .catch((e: any) => {
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
    .start({ listrRenderer: 'silent' })
    .then(() => {
      throw new Error('Should have thrown')
    })
    .catch((err: any) => {
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
    .start({ listrRenderer: 'silent' })
    .then(() => {
      throw new Error('Should have thrown')
    })
    .catch((err: any) => {
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

    return verify.start({ listrRenderer: 'silent' }).then(() => {
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

    return verify.start({ listrRenderer: 'silent' }).then(() => {
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

    return verify.start({ listrRenderer: 'silent' }).then(() => {
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

    // @ts-expect-error - is a sinon stub
    util.exec.restore()
    sinon.stub(util, 'exec').rejects({
      stderr: '',
      stdout: '',
      message: 'Error: EPERM NOT PERMITTED',
    })

    return verify
    .start({ listrRenderer: 'silent' })
    .then(() => {
      throw new Error('Should have thrown')
    })
    .catch((err: any) => {
      stdout = Stdout.capture()
      logger.error(err)

      return snapshot('fails with no stderr 1', normalize(stdout.toString()))
    })
  })

  describe('on linux', () => {
    beforeEach(() => {
      // @ts-expect-error - is a sinon stub
      xvfb.isNeeded.returns(true)

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })
    })

    it('starts xvfb', () => {
      return verify.start({ listrRenderer: 'silent' }).then(() => {
        expect(xvfb.start).to.be.called
      })
    })

    it('stops xvfb on spawned process close', () => {
      return verify.start({ listrRenderer: 'silent' }).then(() => {
        expect(xvfb.stop).to.be.called
      })
    })

    it('logs error and exits when starting xvfb fails', () => {
      const err: any = new Error('test without xvfb')

      // @ts-expect-error - is a sinon stub
      xvfb.start.restore()

      err.nonZeroExitCode = true
      err.stack = 'xvfb? no dice'
      sinon.stub(xvfb._xvfb, 'startAsync').rejects(err)

      return verify.start({ listrRenderer: 'silent' })
      .then(() => {
        throw new Error('should have thrown')
      })
      .catch((err: any) => {
        expect(xvfb.stop).to.be.calledOnce

        logger.error(err)

        snapshot('xvfb fails 1', normalize(stdout.toString()))
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

      // @ts-expect-error - is a sinon stub
      util.isCi.returns(true)
    })

    it('uses verbose renderer', () => {
      return verify.start({ listrRenderer: 'silent' }).then(() => {
        snapshot('verifying in ci 1', normalize(stdout.toString()))
      })
    })

    it('logs error when binary not found', () => {
      mockfs({})

      return verify
      .start({ listrRenderer: 'silent' })
      .then(() => {
        throw new Error('Should have thrown')
      })
      .catch((err: any) => {
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
      // @ts-expect-error - is a sinon stub
      .withArgs(realEnvBinaryPath, ['--no-sandbox', '--smoke-test', '--ping=222'])
      .resolves(spawnedProcess)

      return verify.start({ listrRenderer: 'silent' }).then(() => {
        // @ts-expect-error - is a sinon stub
        expect(util.exec.firstCall.args[0]).to.equal(realEnvBinaryPath)
        snapshot('valid CYPRESS_RUN_BINARY 1', normalize(stdout.toString()))
      })
    })

    _.each(['darwin', 'linux', 'win32'], (platform) => {
      return it('can log error to user', () => {
        process.env.CYPRESS_RUN_BINARY = '/custom/'

        ;(os.platform as any).returns(platform)

        return verify
        .start({ listrRenderer: 'silent' })
        .then(() => {
          throw new Error('Should have thrown')
        })
        .catch((err: any) => {
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
      (os.platform as any).returns('linux')

      ;(process.geteuid as any).returns(0) // user is root
      expect(verify.needsSandbox()).to.be.true
    })

    it('needs --no-sandbox on Linux as a non-root', () => {
      (os.platform as any).returns('linux')

      ;(process.geteuid as any).returns(1000) // user is non-root
      expect(verify.needsSandbox()).to.be.true
    })

    it('needs --no-sandbox on Mac as a non-root', () => {
      (os.platform as any).returns('darwin')

      ;(process.geteuid as any).returns(1000) // user is non-root
      expect(verify.needsSandbox()).to.be.true
    })

    it('does not need --no-sandbox on Windows', () => {
      (os.platform as any).returns('win32')
      expect(verify.needsSandbox()).to.be.false
    })
  })
})

// TODO this needs documentation with examples badly.
function createfs ({ alreadyVerified, executable, packageVersion, customDir }: any) {
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

  let mockFiles: any = {
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
