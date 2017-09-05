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
const info = require('./info')

const differentFrom = (a, b) => a !== b

const verificationError = (message) => {
  return _.extend(new Error(''), { name: '', message, isVerificationError: true })
}

const xvfbError = (message) => {
  return _.extend(new Error(''), { name: '', message, isXvfbError: true })
}

const checkIfNotInstalledOrMissingExecutable = (installedVersion, executable) => {
  debug('checking if executable exists', executable)

  return fs.statAsync(executable)
  .then(() => {
    // after verifying its physically accessible
    // we can now check that its installed in info.json
    if (!installedVersion) {
      throw new Error()
    }
  })
  .catch(() => {
    // bail if we don't have an installed version
    // because its physically missing or its
    // not in info.json
    return throwFormErrorText(errors.missingApp)(stripIndent`
      Cypress executable not found at: ${chalk.cyan(executable)}
    `)
  })
}

const writeVerifiedVersion = (verifiedVersion) => {
  debug('writing verified version string "%s"', verifiedVersion)

  return info.ensureFileInfoContents()
  .then((contents) => {
    return info.writeInfoFileContents(_.extend(contents, { verifiedVersion }))
  })
}

const runSmokeTest = () => {
  debug('running smoke test')
  let stderr = ''
  let stdout = ''
  const cypressExecPath = info.getPathToExecutable()
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
          if (smokeTestReturned !== String(random)) {
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

function testBinary (version) {
  debug('running binary verification check', version)

  const dir = info.getPathToUserExecutableDir()

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
        // clear out the verified version
        return writeVerifiedVersion(null)
        .then(() => {
          return Promise.all([
            runSmokeTest(),
            Promise.delay(1500), // good user experience
          ])
        })
        .then(() => {
          return writeVerifiedVersion(version)
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

const maybeVerify = (options = {}) => {
  return info.getVerifiedVersion()
  .then((verifiedVersion) => {
    const packageVersion = util.pkgVersion()

    debug('has verified version', verifiedVersion)

    // verify if packageVersion and verifiedVersion are different
    const shouldVerify = options.force || differentFrom(packageVersion, verifiedVersion)

    debug('run verification check?', shouldVerify)

    if (shouldVerify) {
      return testBinary(packageVersion)
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

  _.defaults(options, {
    force: false,
    welcomeMessage: true,
  })

  return info.getInstalledVersion()
  .then((installedVersion) => {
    debug('installed version is', installedVersion, 'comparing to', packageVersion)

    // figure out where this executable is supposed to be at
    const executable = info.getPathToExecutable()

    return checkIfNotInstalledOrMissingExecutable(installedVersion, executable)
    .return(installedVersion)
  })
  .then((installedVersion) => {
    if (installedVersion !== packageVersion) {
      // warn if we installed with CYPRESS_BINARY_VERSION or changed version
      // in the package.json
      const msg = stripIndent`
      Installed version ${chalk.cyan(installedVersion)} does not match the expected package version ${chalk.cyan(packageVersion)}

      Note: there is no guarantee these versions will work properly together.
      `

      logger.warn(msg)

      logger.log()
    }

    return maybeVerify(options)
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
