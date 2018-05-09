const _ = require('lodash')
const cp = require('child_process')
const chalk = require('chalk')
const Listr = require('listr')
const debug = require('debug')('cypress:cli')
const verbose = require('@cypress/listr-verbose-renderer')
const { stripIndent } = require('common-tags')
const Promise = require('bluebird')

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
      return throwFormErrorText(errors.missingApp)(stripIndent`
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

  const dir = state.getPathToExecutableDir(binaryDir)

  // let the user know what version of cypress we're downloading!
  logger.log(
    chalk.yellow(
      `It looks like this is your first time using Cypress: ${chalk.cyan(version)}`
    )
  )

  logger.log()

  // if we are running in CI then use
  // the verbose renderer else use
  // the default
  const rendererOptions = {
    renderer: util.isCi() ? verbose : 'default',
  }


  const tasks = new Listr([
    {
      title: util.titleize('Verifying Cypress can run', chalk.gray(dir)),
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
              chalk.gray(dir)
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

const maybeVerify = (installedVersion, installPath, options = {}) => {
  return state.getBinaryVerifiedAsync()
  .then((isVerified) => {

    debug('is Verified ?', isVerified)

    let shouldVerify = !isVerified
    // force verify if options.force
    if (options.force) {
      debug('force verify')
      shouldVerify = true
    }

    if (shouldVerify) {
      return testBinary(installedVersion, installPath)
      .then(() => {
        if (options.welcomeMessage) {
          logger.log()
          logger.warn('Opening Cypress...')
        }
      })
    }
  })
}

const start = (options = {}) => {
  debug('verifying Cypress app')

  const packageVersion = util.pkgVersion()
  const binaryDir = options.cypressPath || state.getBinaryDir(packageVersion)

  _.defaults(options, {
    force: false,
    welcomeMessage: true,
  })
  return isMissingExecutable(binaryDir)
  .then(() => state.getBinaryPkgVersionAsync(binaryDir))
  .then((binaryVersion) => {

    if (!binaryVersion) {
      debug('no Cypress binary found for cli version ', packageVersion)
      return throwFormErrorText(errors.missingApp)(stripIndent`
      Cypress binary version not found in: ${chalk.cyan(binaryDir)}
    `)
    }

    debug('installed version is', binaryVersion, 'comparing to', packageVersion)

    if (binaryVersion !== packageVersion) {
      // warn if we installed with CYPRESS_BINARY_VERSION or changed version
      // in the package.json
      const msg = stripIndent`
      Installed version ${chalk.cyan(binaryVersion)} does not match the expected package version ${chalk.cyan(packageVersion)}

      Note: there is no guarantee these versions will work properly together.
      `

      logger.warn(msg)

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
