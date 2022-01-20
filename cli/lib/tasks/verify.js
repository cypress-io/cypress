const _ = require('lodash')
const chalk = require('chalk')
const { Listr } = require('listr2')
const debug = require('debug')('cypress:cli')
const { stripIndent } = require('common-tags')
const Promise = require('bluebird')
const logSymbols = require('log-symbols')
const path = require('path')
const os = require('os')

const verbose = require('../VerboseRenderer')
const { throwFormErrorText, errors } = require('../errors')
const util = require('../util')
const logger = require('../logger')
const xvfb = require('../exec/xvfb')
const state = require('./state')

const VERIFY_TEST_RUNNER_TIMEOUT_MS = +util.getEnv('CYPRESS_VERIFY_TIMEOUT') || 30000

const checkExecutable = (binaryDir) => {
  const executable = state.getPathToExecutable(binaryDir)

  debug('checking if executable exists', executable)

  return util.isExecutableAsync(executable)
  .then((isExecutable) => {
    debug('Binary is executable? :', isExecutable)
    if (!isExecutable) {
      return throwFormErrorText(errors.binaryNotExecutable(executable))()
    }
  })
  .catch({ code: 'ENOENT' }, () => {
    if (util.isCi()) {
      return throwFormErrorText(errors.notInstalledCI(executable))()
    }

    return throwFormErrorText(errors.missingApp(binaryDir))(stripIndent`
      Cypress executable not found at: ${chalk.cyan(executable)}
    `)
  })
}

const runSmokeTest = (binaryDir, options) => {
  let executable = state.getPathToExecutable(binaryDir)

  const onSmokeTestError = (smokeTestCommand, linuxWithDisplayEnv) => {
    return (err) => {
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

  const needsXvfb = xvfb.isNeeded()

  debug('needs Xvfb?', needsXvfb)

  /**
   * Spawn Cypress running smoke test to check if all operating system
   * dependencies are good.
   */
  const spawn = (linuxWithDisplayEnv) => {
    const random = _.random(0, 1000)
    const args = ['--smoke-test', `--ping=${random}`]

    if (needsSandbox()) {
      // electron requires --no-sandbox to run as root
      debug('disabling Electron sandbox')
      args.unshift('--no-sandbox')
    }

    if (options.dev) {
      executable = 'node'
      args.unshift(
        path.resolve(__dirname, '..', '..', '..', 'scripts', 'start.js'),
      )
    }

    const smokeTestCommand = `${executable} ${args.join(' ')}`

    debug('running smoke test')
    debug('using Cypress executable %s', executable)
    debug('smoke test command:', smokeTestCommand)
    debug('smoke test timeout %d ms', options.smokeTestTimeout)

    const env = _.extend({}, process.env, {
      ELECTRON_ENABLE_LOGGING: true,
    })

    const stdioOptions = _.extend({}, {
      env,
      timeout: options.smokeTestTimeout,
    })

    return Promise.resolve(util.exec(
      executable,
      args,
      stdioOptions,
    ))
    .catch(onSmokeTestError(smokeTestCommand, linuxWithDisplayEnv))
    .then((result) => {
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
    })
  }

  const spawnInXvfb = (linuxWithDisplayEnv) => {
    return xvfb
    .start()
    .then(() => {
      return spawn(linuxWithDisplayEnv)
    })
    .finally(xvfb.stop)
  }

  const userFriendlySpawn = (linuxWithDisplayEnv) => {
    debug('spawning, should retry on display problem?', Boolean(linuxWithDisplayEnv))

    return spawn(linuxWithDisplayEnv)
    .catch({ code: 'INVALID_SMOKE_TEST_DISPLAY_ERROR' }, () => {
      return spawnInXvfb(linuxWithDisplayEnv)
    })
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

function testBinary (version, binaryDir, options) {
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

  if (logger.logLevel() === 'silent') renderer = 'silent'

  const rendererOptions = {
    renderer,
  }

  const tasks = new Listr([
    {
      options: { title: util.titleize('Verifying Cypress can run', chalk.gray(binaryDir)) },
      task: (ctx, task) => {
        debug('clearing out the verified version')

        return state.clearBinaryStateAsync(binaryDir)
        .then(() => {
          return Promise.all([
            runSmokeTest(binaryDir, options),
            Promise.resolve().delay(1500), // good user experience
          ])
        })
        .then(() => {
          debug('write verified: true')

          return state.writeBinaryVerifiedAsync(true, binaryDir)
        })
        .then(() => {
          util.setTaskTitle(
            task,
            util.titleize(
              chalk.green('Verified Cypress!'),
              chalk.gray(binaryDir),
            ),
            rendererOptions.renderer,
          )
        })
      },
    },
  ], { rendererOptions })

  return tasks.run()
}

const maybeVerify = (installedVersion, binaryDir, options) => {
  return state.getBinaryVerifiedAsync(binaryDir)
  .then((isVerified) => {
    debug('is Verified ?', isVerified)

    let shouldVerify = !isVerified

    // force verify if options.force
    if (options.force) {
      debug('force verify')
      shouldVerify = true
    }

    if (shouldVerify) {
      return testBinary(installedVersion, binaryDir, options)
      .then(() => {
        if (options.welcomeMessage) {
          logger.log()
          logger.log('Opening Cypress...')
        }
      })
    }
  })
}

const start = (options = {}) => {
  debug('verifying Cypress app')

  const packageVersion = util.pkgVersion()
  let binaryDir = state.getBinaryDir(packageVersion)

  _.defaults(options, {
    dev: false,
    force: false,
    welcomeMessage: true,
    smokeTestTimeout: VERIFY_TEST_RUNNER_TIMEOUT_MS,
  })

  if (options.dev) {
    return runSmokeTest('', options)
  }

  const parseBinaryEnvVar = () => {
    const envBinaryPath = util.getEnv('CYPRESS_RUN_BINARY')

    debug('CYPRESS_RUN_BINARY exists, =', envBinaryPath)
    logger.log(stripIndent`
      ${chalk.yellow('Note:')} You have set the environment variable:

      ${chalk.white('CYPRESS_RUN_BINARY=')}${chalk.cyan(envBinaryPath)}

      This overrides the default Cypress binary path used.
    `)

    logger.log()

    return util.isExecutableAsync(envBinaryPath)
    .then((isExecutable) => {
      debug('CYPRESS_RUN_BINARY is executable? :', isExecutable)
      if (!isExecutable) {
        return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))(stripIndent`
          The supplied binary path is not executable
          `)
      }
    })
    .then(() => {
      return state.parseRealPlatformBinaryFolderAsync(envBinaryPath)
    })
    .then((envBinaryDir) => {
      if (!envBinaryDir) {
        return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))()
      }

      debug('CYPRESS_RUN_BINARY has binaryDir:', envBinaryDir)

      binaryDir = envBinaryDir
    })
    .catch({ code: 'ENOENT' }, (err) => {
      return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))(err.message)
    })
  }

  return Promise.try(() => {
    debug('checking environment variables')
    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      return parseBinaryEnvVar()
    }
  })
  .then(() => {
    return checkExecutable(binaryDir)
  })
  .tap(() => {
    return debug('binaryDir is ', binaryDir)
  })
  .then(() => {
    return state.getBinaryPkgAsync(binaryDir)
  })
  .then((pkg) => {
    return state.getBinaryPkgVersion(pkg)
  })
  .then((binaryVersion) => {
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

    return maybeVerify(binaryVersion, binaryDir, options)
  })

  .catch((err) => {
    if (err.known) {
      throw err
    }

    return throwFormErrorText(errors.unexpected)(err.stack)
  })
}

const isLinuxLike = () => os.platform() !== 'win32'

/**
 * Returns true if running on a system where Electron needs "--no-sandbox" flag.
 * @see https://crbug.com/638180
 *
 * On Debian we had problems running in sandbox even for non-root users.
 * @see https://github.com/cypress-io/cypress/issues/5434
 * Seems there is a lot of discussion around this issue among Electron users
 * @see https://github.com/electron/electron/issues/17972
*/
const needsSandbox = () => isLinuxLike()

module.exports = {
  start,
  VERIFY_TEST_RUNNER_TIMEOUT_MS,
  needsSandbox,
}
