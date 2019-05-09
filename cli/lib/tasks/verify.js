const _ = require('lodash')
const chalk = require('chalk')
const Listr = require('listr')
const debug = require('debug')('cypress:cli')
const verbose = require('@cypress/listr-verbose-renderer')
const { stripIndent } = require('common-tags')
const Promise = require('bluebird')
const logSymbols = require('log-symbols')

const { throwFormErrorText, errors } = require('../errors')
const util = require('../util')
const logger = require('../logger')
const xvfb = require('../exec/xvfb')
const state = require('./state')

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
  debug('running smoke test')
  const cypressExecPath = state.getPathToExecutable(binaryDir)

  debug('using Cypress executable %s', cypressExecPath)

  const onXvfbError = (err) => {
    debug('caught xvfb error %s', err.message)

    return throwFormErrorText(errors.missingXvfb)(`Caught error trying to run XVFB: "${err.message}"`)
  }

  const onSmokeTestError = (smokeTestCommand, runningWithOurXvfb, prevDisplayError) => {
    return (err) => {
      debug('Smoke test failed:', err)

      let errMessage = err.stderr || err.message
      debug('error message:', errMessage)

      if (err.timedOut) {
        debug('error timedOut is true')
        return throwFormErrorText(errors.smokeTestFailure(smokeTestCommand, true))(errMessage)
      }

      if (!runningWithOurXvfb && !prevDisplayError && util.isDisplayError(errMessage)) {
        // running without our XVFB
        // for the very first time
        // and we hit invalid display error
        debug('Smoke test hit Linux display problem: %s', errMessage)
        const err = new Error(errMessage)

        err.displayError = true
        err.platform = 'linux'
        throw err
      }

      if (prevDisplayError) {
        debug('this was our 2nd attempt at verifying')
        debug('first we tried with user-given DISPLAY')
        debug('now we have tried spinning our own XVFB')
        debug('and yet it still has failed with')
        debug(errMessage)

        return throwFormErrorText(errors.invalidDisplayError)(errMessage, prevDisplayError.message)
      }

      debug('throwing missing dependency error')
      return throwFormErrorText(errors.missingDependency)(errMessage)
    }
  }

  const needsXvfb = xvfb.isNeeded()

  debug('needs XVFB?', needsXvfb)

  /**
   * Spawn Cypress running smoke test to check if all operating system
   * dependencies are good.
   */
  const spawn = (runningWithOurXvfb, prevDisplayError) => {
    const random = _.random(0, 1000)
    const args = ['--smoke-test', `--ping=${random}`, '--enable-logging']
    const smokeTestCommand = `${cypressExecPath} ${args.join(' ')}`

    debug('smoke test command:', smokeTestCommand)

    return Promise.resolve(util.exec(
      cypressExecPath,
      args,
      { timeout: options.smokeTestTimeout }
    ))
    .catch(onSmokeTestError(smokeTestCommand, runningWithOurXvfb, prevDisplayError))
    .then((result) => {

      // TODO: when execa > 1.1 is released
      // change this to `result.all` for both stderr and stdout
      const smokeTestReturned = result.stdout

      debug('smoke test stdout "%s"', smokeTestReturned)

      if (!util.stdoutLineMatches(String(random), smokeTestReturned)) {
        debug('Smoke test failed because could not find %d in:', random, result)

        return throwFormErrorText(errors.smokeTestFailure(smokeTestCommand, false))(result.stderr || result.stdout)
      }
    })
  }

  const spinXvfbAndVerify = (prevDisplayError) => {
    return xvfb.start()
    .catch(onXvfbError)
    .then(spawn.bind(null, true, prevDisplayError))
    .finally(() => {
      return xvfb.stop()
      .catch(onXvfbError)
    })
  }

  if (needsXvfb) {
    return spinXvfbAndVerify()
  }

  return spawn()
  .catch({ displayError: true, platform: 'linux' }, (e) => {
    debug('there was a display error')
    debug('will try spinning our own XVFB and verify Cypress')

    return spinXvfbAndVerify(e)
  })
}

function testBinary (version, binaryDir, options) {
  debug('running binary verification check', version)

  logger.log(stripIndent`
  It looks like this is your first time using Cypress: ${chalk.cyan(version)}
  `)

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
      title: util.titleize('Verifying Cypress can run', chalk.gray(binaryDir)),
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
              chalk.gray(binaryDir)
            ),
            rendererOptions.renderer
          )
        })
      },
    },
  ], rendererOptions)

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
    force: false,
    welcomeMessage: true,
    smokeTestTimeout: 10000,
  })

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
    return state.getBinaryPkgVersionAsync(binaryDir)
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

module.exports = {
  start,
}
