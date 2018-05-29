const _ = require('lodash')
const cp = require('child_process')
const chalk = require('chalk')
const Listr = require('listr')
const debug = require('debug')('cypress:cli')
const verbose = require('@cypress/listr-verbose-renderer')
const { stripIndent } = require('common-tags')
const Promise = require('bluebird')
const logSymbols = require('log-symbols')


const { throwFormErrorText, errors } = require('../errors')
const fs = require('../fs')
const util = require('../util')
const logger = require('../logger')
const xvfb = require('../exec/xvfb')
const state = require('./state')

const verificationError = (message) => {
  return _.extend(new Error(''), { name: '', message, isVerificationError: true })
}

const xvfbError = (message) => {
  return _.extend(new Error(''), { name: '', message, isXvfbError: true })
}

const isMissingExecutable = (binaryDir) => {
  const executable = state.getPathToExecutable(binaryDir)
  debug('checking if executable exists', executable)
  return fs.pathExistsAsync(executable)
  .then((exists) => {
    if (!exists) {
      return throwFormErrorText(errors.missingApp(binaryDir))(stripIndent`
      Cypress executable not found at: ${chalk.cyan(executable)}
    `)
    }
  })
}

const runSmokeTest = (binaryDir) => {
  debug('running smoke test')
  let stderr = ''
  let stdout = ''
  const cypressExecPath = state.getPathToExecutable(binaryDir)
  debug('using Cypress executable %s', cypressExecPath)

  // TODO switch to execa for this?
  const spawn = () => {
    return new Promise((resolve, reject) => {
      const random = _.random(0, 1000)
      const args = ['--smoke-test', `--ping=${random}`]
      const smokeTestCommand = `${cypressExecPath} ${args.join(' ')}`
      debug('smoke test command:', smokeTestCommand)
      const child = cp.spawn(cypressExecPath, args)

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.on('error', reject)

      child.on('close', (code) => {
        if (code === 0) {
          const smokeTestReturned = stdout.trim()
          debug('smoke test output "%s"', smokeTestReturned)

          if (!util.stdoutLineMatches(String(random), smokeTestReturned)) {
            return reject(new Error(stripIndent`
              Smoke test returned wrong code.

              Command was: ${smokeTestCommand}

              Returned: ${smokeTestReturned}
            `))
          }

          return resolve()
        }

        reject(verificationError(stderr))
      })
    })
  }

  const onXvfbError = (err) => {
    debug('caught xvfb error %s', err.message)
    throw xvfbError(`Caught error trying to run XVFB: "${err.message}"`)
  }

  const needsXvfb = xvfb.isNeeded()
  debug('needs XVFB?', needsXvfb)

  if (needsXvfb) {
    return xvfb.start()
    .catch(onXvfbError)
    .then(spawn)
    .finally(() => {
      return xvfb.stop()
      .catch(onXvfbError)
    })
  } else {
    return spawn()
  }
}

function testBinary (version, binaryDir) {
  debug('running binary verification check', version)


  logger.log(stripIndent`
  It looks like this is your first time using Cypress: ${chalk.cyan(version)}
  `)

  logger.log()

  // if we are running in CI then use
  // the verbose renderer else use
  // the default
  const rendererOptions = {
    renderer: util.isCi() ? verbose : 'default',
  }


  const tasks = new Listr([
    {
      title: util.titleize('Verifying Cypress can run', chalk.gray(binaryDir)),
      task: (ctx, task) => {
        debug('clearing out the verified version')
        return state.clearBinaryStateAsync(binaryDir)
        .then(() => {
          return Promise.all([
            runSmokeTest(binaryDir),
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
        .catch({ isXvfbError: true }, throwFormErrorText(errors.missingXvfb))
        .catch({ isVerificationError: true }, throwFormErrorText(errors.missingDependency))
      },
    },
  ], rendererOptions)

  return tasks.run()
}

const maybeVerify = (installedVersion, binaryDir, options = {}) => {
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
      return testBinary(installedVersion, binaryDir)
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
  })

  const checkEnvVar = () => {
    debug('checking environment variables')
    if (process.env.CYPRESS_RUN_BINARY) {
      const envBinaryPath = process.env.CYPRESS_RUN_BINARY
      debug('CYPRESS_RUN_BINARY exists, =', envBinaryPath)
      logger.log(stripIndent`
        ${chalk.yellow('Note:')} You have set the environment variable: ${chalk.white('CYPRESS_RUN_BINARY=')}${chalk.cyan(envBinaryPath)}:
        
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
      .then(() => state.parseRealPlatformBinaryFolderAsync(envBinaryPath))
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
    return Promise.resolve()
  }


  return checkEnvVar()
  .then(() => isMissingExecutable(binaryDir))
  .tap(() => debug('binaryDir is ', binaryDir))
  .then(() => state.getBinaryPkgVersionAsync(binaryDir))
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
  maybeVerify,
}
