const _ = require('lodash')
const chalk = require('chalk')
const cp = require('child_process')
const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const debug = require('debug')('cypress:cli')
const R = require('ramda')
const { stripIndent } = require('common-tags')
const ProgressBar = require('progress')

const xvfb = require('../exec/xvfb')
const { formErrorText, errors } = require('../errors')
const packagePath = path.join(__dirname, '..', '..', 'package.json')
const packageVersion = require(packagePath).version

const log = (...messages) => {
  console.log(...messages) // eslint-disable-line no-console
}

// splits long text into lines and calls log()
// on each one to allow easy unit testing for specific message
const logLines = (text) => {
  const lines = text.split('\n')
  R.forEach(log, lines)
}

const getPlatformExecutable = () => {
  const platform = os.platform()
  switch (platform) {
    case 'darwin': return 'Cypress.app/Contents/MacOS/Cypress'
    case 'linux': return 'Cypress/Cypress'
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

const getInstallationDir = () => {
  return path.join(__dirname, '..', '..', 'dist')
}

const getInfoFilePath = () => {
  const infoPath = path.join(getInstallationDir(), 'info.json')
  debug('path to info.json file %s', infoPath)
  return infoPath
}

const getInstalledVersion = () => {
  return ensureFileInfoContents()
    .tap(debug)
    .get('version')
}

const getVerifiedVersion = () => {
  return ensureFileInfoContents().get('verifiedVersion')
}

const ensureInstallationDir = () => {
  return fs.ensureDirAsync(getInstallationDir())
}

const clearVersionState = () => {
  return ensureFileInfoContents().then((contents) => {
    return writeInfoFileContents(_.omit(contents, 'version', 'verifiedVersion'))
  })
}

const writeInstalledVersion = (version) => {
  return ensureFileInfoContents().then((contents) => {
    return writeInfoFileContents(_.extend(contents, { version }))
  })
}

const writeVerifiedVersion = (verifiedVersion) => {
  debug('writing verified version string "%s"', verifiedVersion)
  return ensureFileInfoContents().then((contents) => {
    return writeInfoFileContents(_.extend(contents, { verifiedVersion }))
  })
}

const getPathToExecutable = () => {
  return path.join(getInstallationDir(), getPlatformExecutable())
}

const getPathToUserExecutable = () => {
  return path.join(getInstallationDir(), getPlatformExecutable().split('/')[0])
}

const getInfoFileContents = () => {
  return fs.readJsonAsync(getInfoFilePath())
}

const ensureFileInfoContents = () => {
  return getInfoFileContents().catch(() => {
    debug('could not read info file')
    return {}
  })
}

const writeInfoFileContents = (contents) => {
  return fs.outputJsonAsync(getInfoFilePath(), contents)
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

const runSmokeTest = () => {
  debug('running smoke test')
  let stderr = ''
  let stdout = ''
  const needsXvfb = xvfb.isNeeded()
  debug('needs XVFB?', needsXvfb)
  const cypressExecPath = getPathToExecutable()
  debug('using Cypress executable %s', cypressExecPath)

  // TODO switch to execa for this?
  const spawn = () => {
    return new Promise((resolve, reject) => {
      const random = _.random(0, 1000)
      const args = ['--smoke-test', `--ping=${random}`]
      const smokeTestCommand = `${cypressExecPath} ${args.join(' ')}`
      debug('command:', smokeTestCommand)
      const child = cp.spawn(cypressExecPath, args)

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      if (needsXvfb) {
        child.on('close', () => {
          debug('spawn stop, closing XVFB')
          xvfb.stop()
        })
      }

      child.on('error', (err) => {
        debug('spawn error', err)
        reject(appMissingError(stripIndent`
          Could not execute Cypress
          ${err.message}
        `))
      })

      child.on('exit', (code) => {
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

const differentFrom = (a) => (b) => a !== b

const logStart = () =>
  log(chalk.yellow('⧖ Verifying Cypress executable...'))

const logSuccess = () => {
  log(chalk.green('✓ Successfully verified Cypress executable'))
}

const logFailed = () => {
  log()
  log(chalk.red('✖ Failed to verify Cypress executable.'))
  log()
}

const logWarning = (text) => {
  log(chalk.yellow(`! ${text}`))
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

const failProcess = () =>
  process.exit(1)

const explainAndFail = (info) => (err) =>
  formErrorText(info, err)
    .then(logLines)
    .then(logFailed)
    .then(failProcess)

const maybeVerify = (options = {}) => {
  debug('check if verified')
  const shouldVerify = options.force ? R.T : differentFrom(packageVersion)

  return getVerifiedVersion()
  .then((verifiedVersion) => {
    if (shouldVerify(verifiedVersion)) {
      return testVersion(packageVersion)
    }
  })
  .catch({ isAppMissing: true }, explainAndFail(errors.missingApp))
  .catch({ isXvfbError: true }, explainAndFail(errors.missingXvfb))
  .catch({ isVerificationError: true }, explainAndFail(errors.missingDependency))
}

const verify = (options = {}) => {
  debug('verifying Cypress app')
  logStart()

  _.defaults(options, {
    force: false,
  })

  return getInstalledVersion()
  .then((installedVersion) => {
    if (!installedVersion) {
      return explainAndFail(errors.missingApp)(new Error('Missing install'))
    } else if (installedVersion !== packageVersion) {
      // warn if we installed with CYPRESS_VERSION or changed version
      // in the package.json
      const msg = `Installed version (${installedVersion}) does not match package version (${packageVersion})`
      logWarning(msg)
    }
  })
  .then(() => {
    const executable = getPathToExecutable()
    return fs.statAsync(executable)
      .then(() => {
        log(chalk.green('✓ Cypress executable found at:'), chalk.cyan(executable))
      })
      .catch(() =>
        explainAndFail(errors.missingApp)(new Error(stripIndent`
          Cypress executable not found at
          ${executable}
        `))
      )
  })
  .then(() => {
    return maybeVerify(options)
  })
  .catch(explainAndFail(errors.unexpected))
}

const makeMockBar = (title, barOptions = { total: 100 }) => {
  if (!title) {
    throw new Error('Missing progress bar title')
  }
  /* eslint-disable no-console */
  console.log(chalk.blue(`${title}, please wait`))
  return {
    mock: true,
    curr: 0,
    tick () {
      this.curr += 1
      if (this.curr >= barOptions.total) {
        this.complete = true
        console.log(chalk.green(`${title} finished`))
      }
    },
    terminate () {
      console.log(`${title} failed`)
    },
  }
}

const getProgressBar = (title, barOptions) => {
  const isCI = require('is-ci')
  const ascii = [
    chalk.white('  -'),
    chalk.blue(title),
    chalk.yellow('[:bar]'),
    chalk.white(':percent'),
    chalk.gray(':etas'),
  ]
  debug('progress bar with options %j isCI?', barOptions, isCI)
  return isCI ? makeMockBar(title, barOptions) : new ProgressBar(ascii.join(' '), barOptions)
}

module.exports = {
  clearVersionState,
  ensureInstallationDir,
  getInstallationDir,
  getInstalledVersion,
  getPathToUserExecutable,
  getPathToExecutable,
  log,
  verify,
  maybeVerify,
  writeInstalledVersion,
  getProgressBar,
}
