const _ = require('lodash')
const R = require('ramda')
const cp = require('child_process')
const chalk = require('chalk')
const debug = require('debug')('cypress:cli')
const { stripIndent } = require('common-tags')
const Promise = require('bluebird')

const fs = require('../fs')
const util = require('../util')
const logger = require('../logger')
const xvfb = require('../exec/xvfb')
const info = require('./info')

const { formErrorText, errors } = require('../errors')

const packageVersion = util.pkgVersion()

const logFailed = () => {
  logger.log()
  logger.log(chalk.red('✖ Failed to verify Cypress executable.'))
  logger.log()
}

const differentFrom = (a) => (b) => a !== b

const logSuccess = () => {
  logger.log(chalk.green('✓ Successfully verified Cypress executable'))
}

const logStart = () => {
  logger.log(chalk.yellow('⧖ Verifying Cypress executable...'))
}

const logWarning = (text) => {
  logger.log(chalk.yellow(`! ${text}`))
}

const verificationError = (message) => {
  return _.extend(new Error(''), { name: '', message, isVerificationError: true })
}

const xvfbError = (message) => {
  return _.extend(new Error(''), { name: '', message, isXvfbError: true })
}

const appMissingError = (message) => {
  return _.extend(new Error(''), { name: '', message, isAppMissing: true })
}

const writeVerifiedVersion = (verifiedVersion) => {
  debug('writing verified version string "%s"', verifiedVersion)
  return info.ensureFileInfoContents().then((contents) => {
    return info.writeInfoFileContents(_.extend(contents, { verifiedVersion }))
  })
}

const runSmokeTest = () => {
  debug('running smoke test')
  let stderr = ''
  let stdout = ''
  const needsXvfb = xvfb.isNeeded()
  debug('needs XVFB?', needsXvfb)
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

      child.on('error', (err) => {
        debug('smoke test spawn error', err)
        reject(appMissingError(stripIndent`
          Could not execute Cypress
          ${err.message}
        `))
      })

      child.on('close', (code) => {
        if (code === 0) {
          const smokeTestReturned = stdout.trim()
          debug('smoke test output "%s"', smokeTestReturned)
          if (smokeTestReturned !== String(random)) {
            return reject(new Error(stripIndent`
              Smoke test returned wrong code.
              command was: ${smokeTestCommand}
              returned: ${smokeTestReturned}
            `))
          }

          if (needsXvfb) {
            return xvfb.stop()
            .then(() => {
              return resolve()
            })
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

  const cypressError = (err) => {
    // pass other errors unchangd
    if (err.isAppMissing || err.isXvfbError) {
      throw err
    }
    throw verificationError(err.message)
  }

  if (needsXvfb) {
    return xvfb.start()
    .catch(onXvfbError)
    .then(spawn)
    .catch(cypressError)
  } else {
    return spawn()
  }
}


function testVersion (version) {
  return writeVerifiedVersion(null)
    .then(runSmokeTest)
    .then(() => {
      logSuccess()
      return writeVerifiedVersion(version)
    }, (err) => {
      throw err
    })
}

const explainAndThrow = (info) => (err) => {
  err.known = true
  return formErrorText(info, err)
    .then(logger.logLines)
    .then(logFailed)
    .throw(err)
}

const maybeVerify = (options = {}) => {
  debug('check if verified')
  const shouldVerify = options.force ? R.T : differentFrom(packageVersion)

  return info.getVerifiedVersion()
  .then((verifiedVersion) => {
    if (shouldVerify(verifiedVersion)) {
      logStart()
      return testVersion(packageVersion)
    }
  })
  .catch({ isAppMissing: true }, explainAndThrow(errors.missingApp))
  .catch({ isXvfbError: true }, explainAndThrow(errors.missingXvfb))
  .catch({ isVerificationError: true }, explainAndThrow(errors.missingDependency))
}

const verify = (options = {}) => {
  debug('verifying Cypress app')

  _.defaults(options, {
    force: false,
  })

  return info.getInstalledVersion()
  .then((installedVersion) => {
    if (!installedVersion) {
      return explainAndThrow(errors.missingApp)(new Error('Missing install'))
    } else if (installedVersion !== packageVersion) {
      // warn if we installed with CYPRESS_VERSION or changed version
      // in the package.json
      const msg = `Installed version (${installedVersion}) does not match package version (${packageVersion})`
      logWarning(msg)
    }
  })
  .then(() => {
    const executable = info.getPathToExecutable()
    return fs.statAsync(executable)
      .then(() => {
        logger.log(chalk.green('✓ Cypress executable found at:'), chalk.cyan(executable))
      })
      .catch(() =>
        explainAndThrow(errors.missingApp)(new Error(stripIndent`
          Cypress executable not found at
          ${executable}
        `))
      )
  })
  .then(() => {
    return maybeVerify(options)
  })
  .catch((err) => {
    if (err.known) {
      throw err
    }
    explainAndThrow(errors.unexpected)(err)
  })
}

module.exports = {
  verify,

  maybeVerify,
}
