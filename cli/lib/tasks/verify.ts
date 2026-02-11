import _ from 'lodash'
import chalk from 'chalk'
import { Listr } from 'listr2'
import Debug from 'debug'
import { stripIndent } from 'common-tags'
import Bluebird from 'bluebird'
import logSymbols from 'log-symbols'
import os from 'os'
import verbose from '../VerboseRenderer'
import { throwFormErrorText, errors } from '../errors'
import util from '../util'
import logger from '../logger'
import xvfb from '../exec/xvfb'
import state from './state'
import { relativeToRepoRoot } from '../relative-to-repo-root'

const debug = Debug('cypress:cli')

export const verifyTestRunnerTimeoutMs = () => {
  const verifyTimeout = +(util?.getEnv('CYPRESS_VERIFY_TIMEOUT') || 'NaN')

  if (_.isNumber(verifyTimeout) && !_.isNaN(verifyTimeout)) {
    return verifyTimeout
  }

  return 30000
}

const checkExecutable = async (binaryDir: string): Promise<void> => {
  const executable = state.getPathToExecutable(binaryDir)

  debug('checking if executable exists', executable)

  try {
    const isExecutable = await util.isExecutableAsync(executable)

    debug('Binary is executable? :', isExecutable)
    if (!isExecutable) {
      return throwFormErrorText(errors.binaryNotExecutable(executable))()
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      if (util.isCi()) {
        return throwFormErrorText(errors.notInstalledCI(executable))()
      }

      return throwFormErrorText(errors.missingApp(binaryDir))(stripIndent`
        Cypress executable not found at: ${chalk.cyan(executable)}
      `)
    }

    throw err
  }
}

const runSmokeTest = (binaryDir: string, options: any): any => {
  let executable = state.getPathToExecutable(binaryDir)

  const needsXvfb = xvfb.isNeeded()

  debug('needs Xvfb?', needsXvfb)

  /**
   * Spawn Cypress running smoke test to check if all operating system
   * dependencies are good.
   */
  const spawn = async (linuxWithDisplayEnv: boolean): Promise<any> => {
    const random = _.random(0, 1000)
    const args = ['--smoke-test', `--ping=${random}`]

    if (needsSandbox()) {
      // electron requires --no-sandbox to run as root
      debug('disabling Electron sandbox')
      args.unshift('--no-sandbox')
    }

    if (options.dev) {
      executable = 'node'
      const startScriptPath = relativeToRepoRoot('scripts/start.js')

      if (!startScriptPath) {
        throw new Error(`Cypress start script (scripts/start.js) not found in parent directory of ${__dirname}`)
      }

      args.unshift(startScriptPath)
    }

    const smokeTestCommand = `${executable} ${args.join(' ')}`

    debug('running smoke test')
    debug('using Cypress executable %s', executable)
    debug('smoke test command:', smokeTestCommand)
    debug('smoke test timeout %d ms', options.smokeTestTimeout)

    const stdioOptions = _.extend({}, {
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
      timeout: options.smokeTestTimeout,
    })

    try {
      const result = await util.exec(
        executable,
        args,
        stdioOptions,
      )

      // TODO: when execa > 1.1 is released
      // change this to `result.all` for both stderr and stdout
      // use lodash to be robust during tests against null result or missing stdout
      const smokeTestStdout = _.get(result, 'stdout', '')

      debug('smoke test stdout "%s"', smokeTestStdout)

      if (!util.stdoutLineMatches(String(random), smokeTestStdout)) {
        debug('Smoke test failed because could not find %d in:', random, result)

        const smokeTestStderr = _.get(result, 'stderr', '')
        const errorText = smokeTestStderr || smokeTestStdout

        return throwFormErrorText(errors.smokeTestFailure(smokeTestCommand, false))(errorText)
      }
    } catch (err: any) {
      debug('Smoke test failed:', err)

      let errMessage = err.stderr || err.message

      debug('error message:', errMessage)

      if (err.timedOut) {
        debug('error timedOut is true')

        return throwFormErrorText(
          errors.smokeTestFailure(smokeTestCommand, true),
        )(errMessage)
      }

      if (linuxWithDisplayEnv && util.isBrokenGtkDisplay(errMessage)) {
        util.logBrokenGtkDisplayWarning()

        return throwFormErrorText(errors.invalidSmokeTestDisplayError)(errMessage)
      }

      return throwFormErrorText(errors.missingDependency)(errMessage)
    }
  }

  const spawnInXvfb = async (linuxWithDisplayEnv?: boolean): Promise<any> => {
    await xvfb.start()

    return spawn(linuxWithDisplayEnv || false).finally(async () => {
      await xvfb.stop()
    })
  }

  const userFriendlySpawn = async (linuxWithDisplayEnv: boolean): Promise<void> => {
    debug('spawning, should retry on display problem?', Boolean(linuxWithDisplayEnv))

    try {
      await spawn(linuxWithDisplayEnv)
    } catch (err: any) {
      if (err.code === 'INVALID_SMOKE_TEST_DISPLAY_ERROR') {
        return spawnInXvfb(linuxWithDisplayEnv)
      }

      throw err
    }
  }

  if (needsXvfb) {
    return spawnInXvfb()
  }

  // if we are on linux and there's already a DISPLAY
  // set, then we may need to rerun cypress after
  // spawning our own Xvfb server
  const linuxWithDisplayEnv = util.isPossibleLinuxWithIncorrectDisplay()

  return userFriendlySpawn(linuxWithDisplayEnv)
}

function testBinary (version: string, binaryDir: string, options: any): Promise<any> {
  debug('running binary verification check', version)

  // if running from 'cypress verify', don't print this message
  if (!options.force) {
    logger.log(stripIndent`
    It looks like this is your first time using Cypress: ${chalk.cyan(version)}
    `)
  }

  logger.log()

  // if we are running in CI then use
  // the verbose renderer else use
  // the default
  let renderer = util.isCi() ? verbose : 'default'

  // NOTE: under test we set the listr renderer to 'silent' in order to get deterministic snapshots
  if (logger.logLevel() === 'silent' || options.listrRenderer) renderer = 'silent'

  const rendererOptions = {
    renderer,
  }

  const tasks = new Listr([
    {
      title: util.titleize('Verifying Cypress can run', chalk.gray(binaryDir)),
      task: async (ctx: any, task: any) => {
        debug('clearing out the verified version')

        await state.clearBinaryStateAsync(binaryDir)

        await Promise.all([
          runSmokeTest(binaryDir, options),
          Bluebird.delay(1500), // good user experience
        ])

        debug('write verified: true')

        await state.writeBinaryVerifiedAsync(true, binaryDir)

        util.setTaskTitle(
          task,
          util.titleize(
            chalk.green('Verified Cypress!'),
            chalk.gray(binaryDir),
          ),
          rendererOptions.renderer as string,
        )
      },
    },
  ] as any, rendererOptions as any)

  return tasks.run()
}

const maybeVerify = async (installedVersion: string, binaryDir: string, options: any): Promise<void> => {
  const isVerified = await state.getBinaryVerifiedAsync(binaryDir)

  debug('is Verified ?', isVerified)

  let shouldVerify = !isVerified

  // force verify if options.force
  if (options.force) {
    debug('force verify')
    shouldVerify = true
  }

  if (shouldVerify) {
    await testBinary(installedVersion, binaryDir, options)

    if (options.welcomeMessage) {
      logger.log()
      logger.log('Opening Cypress...')
    }
  }
}

export const start = async (options: any = {}): Promise<void> => {
  debug('verifying Cypress app')

  _.defaults(options, {
    dev: false,
    force: false,
    welcomeMessage: true,
    smokeTestTimeout: verifyTestRunnerTimeoutMs(),
    skipVerify: util.getEnv('CYPRESS_SKIP_VERIFY') === 'true',
  })

  if (options.skipVerify) {
    debug('skipping verification of the Cypress app')

    return Promise.resolve()
  }

  const packageVersion = util.pkgVersion()

  let binaryDir = state.getBinaryDir(packageVersion)

  if (options.dev) {
    return runSmokeTest('', options)
  }

  const parseBinaryEnvVar = async (): Promise<void> => {
    const envBinaryPath = util.getEnv('CYPRESS_RUN_BINARY')

    debug('CYPRESS_RUN_BINARY exists, =', envBinaryPath)
    logger.log(stripIndent`
      ${chalk.yellow('Note:')} You have set the environment variable:

      ${chalk.white('CYPRESS_RUN_BINARY=')}${chalk.cyan(envBinaryPath)}

      This overrides the default Cypress binary path used.
    `)

    logger.log()

    try {
      const isExecutable = await util.isExecutableAsync(envBinaryPath as string)

      debug('CYPRESS_RUN_BINARY is executable? :', isExecutable)
      if (!isExecutable) {
        return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath as string))(stripIndent`
        The supplied binary path is not executable
        `)
      }

      const envBinaryDir = await state.parseRealPlatformBinaryFolderAsync(envBinaryPath as string)

      if (!envBinaryDir) {
        return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath as string))()
      }

      debug('CYPRESS_RUN_BINARY has binaryDir:', envBinaryDir)

      binaryDir = envBinaryDir
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath as string))(err.message)
      }

      throw err
    }
  }

  try {
    debug('checking environment variables')
    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      await parseBinaryEnvVar()
    }

    await checkExecutable(binaryDir)
    debug('binaryDir is ', binaryDir)
    const pkg = await state.getBinaryPkgAsync(binaryDir)
    const binaryVersion = state.getBinaryPkgVersion(pkg)

    if (!binaryVersion) {
      debug('no Cypress binary found for cli version ', packageVersion)

      return throwFormErrorText(errors.missingApp(binaryDir))(`
      Cannot read binary version from: ${chalk.cyan(state.getBinaryPkgPath(binaryDir))}
    `)
    }

    debug(`Found binary version ${chalk.green(binaryVersion)} installed in: ${chalk.cyan(binaryDir)}`)

    if (binaryVersion !== packageVersion) {
      // warn if we installed with CYPRESS_INSTALL_BINARY or changed version
      // in the package.json
      logger.log(`Found binary version ${chalk.green(binaryVersion)} installed in: ${chalk.cyan(binaryDir)}`)
      logger.log()
      logger.warn(stripIndent`


      ${logSymbols.warning} Warning: Binary version ${chalk.green(binaryVersion)} does not match the expected package version ${chalk.green(packageVersion)}

        These versions may not work properly together.
      `)

      logger.log()
    }

    await maybeVerify(binaryVersion, binaryDir, options)
  } catch (err: any) {
    if (err.known) {
      throw err
    }

    return throwFormErrorText(errors.unexpected)(err.stack)
  }
}

const isLinuxLike = (): boolean => os.platform() !== 'win32'

/**
 * Returns true if running on a system where Electron needs "--no-sandbox" flag.
 * @see https://crbug.com/638180
 *
 * On Debian we had problems running in sandbox even for non-root users.
 * @see https://github.com/cypress-io/cypress/issues/5434
 * Seems there is a lot of discussion around this issue among Electron users
 * @see https://github.com/electron/electron/issues/17972
*/
export const needsSandbox = (): boolean => isLinuxLike()
