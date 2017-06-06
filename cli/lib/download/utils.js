const _ = require('lodash')
const chalk = require('chalk')
const cp = require('child_process')
const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const getos = Promise.promisify(require('getos'))
const fs = Promise.promisifyAll(require('fs-extra'))

const xvfb = require('../exec/xvfb')
const packageVersion = require('../../package').version

const log = (...messages) => {
  console.log(...messages) // eslint-disable-line no-console
}

const getPlatformExecutable = () => {
  const platform = os.platform()
  switch (platform) {
    case 'darwin': return 'Cypress.app/Contents/MacOS/Cypress'
    case 'linux': return 'Cypress/Cypress'
    // case 'win32': return 'Cypress/Cypress.exe'
    default: throw new Error(`Platform: '${platform}' is not supported.`)
  }
}

const logAndFail = (...messages) => {
  log(...messages.map((msg) => chalk.red(msg)))
  process.exit(1)
}

const getInstallationDir = () => {
  return path.join(__dirname, '..', '..', 'dist')
}

const getInstalledVersion = () => {
  return ensureFileInfoContents().get('version')
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
  return fs.readJsonAsync(path.join(getInstallationDir(), 'info.json'))
}

const ensureFileInfoContents = () => {
  return getInfoFileContents().catch(() => {
    return {}
  })
}

const writeInfoFileContents = (contents) => {
  return fs.outputJsonAsync(path.join(getInstallationDir(), 'info.json'), contents)
}

const verificationError = (message) => {
  return _.extend(new Error(''), { name: '', message, isVerificationError: true })
}

const runSmokeTest = () => {
  let stderr = ''
  const needsXvfb = xvfb.isNeeded()

  const spawn = () => {
    return new Promise((resolve, reject) => {
      const child = cp.spawn(getPathToExecutable(), ['--project', path.join(__dirname, 'project')])

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      if (needsXvfb) {
        child.on('close', () => {
          xvfb.stop()
        })
      }

      child.on('exit', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(verificationError(stderr))
        }
      })
    })
  }

  if (needsXvfb) {
    return xvfb.start()
    .then(spawn)
    .catch((err) => {
      throw verificationError(`Could not start XVFB. Make sure it is installed on your system.\n\n${err.stack}`)
    })
  } else {
    return spawn()
  }
}

const getOsVersion = () => {
  if (os.platform() === 'linux') {
    return getos()
    .then((osInfo) => [osInfo.dist, osInfo.release].join(' - '))
    .catch(() => os.release())
  } else {
    return Promise.resolve(os.release())
  }
}

const checkIfVerified = (options) => {
  return getVerifiedVersion()
  .then((verifiedVersion) => {
    if (options.force || verifiedVersion !== packageVersion) {
      log(chalk.green('⧖ Verifying Cypress executable...'))
      return writeVerifiedVersion(null)
      .then(runSmokeTest)
      .then(() => {
        log()
        log(chalk.green('✓ Successfully verified Cypress executable'))
        return writeVerifiedVersion(packageVersion)
      })
    }
  })
  .catch({ isVerificationError: true }, (err) => {
    return getOsVersion().then((version) => {
      log()
      log(chalk.red('✖ Failed to verify Cypress executable.'))
      log()
      log('This is usually caused by a missing dependency. The error below should indicate which dependency is missing. Read our doc on CI dependencies for more information: https://on.cypress.io/continuous-integration#section-dependencies')
      log('----------')
      log()
      log(err.message)
      log()
      log('----------')
      log('Platform:', os.platform())
      log('Version:', version)
      process.exit(1)
    })
  })
}

const verify = (options = {}) => {
  _.defaults(options, {
    force: false,
  })

  return getInstalledVersion()
  .then((installedVersion) => {
    if (!installedVersion) {
      logAndFail('No version of Cypress executable installed. Run `cypress install` and try again.')
    } else if (installedVersion !== packageVersion) {
      logAndFail(`Installed version (${installedVersion}) does not match package version (${packageVersion}). Run \`cypress install\` and try again.`)
    }
  })
  .then(() => {
    return fs.statAsync(getPathToExecutable()).catch(() => {
      logAndFail('Cypress executable not found. Run `cypress install` and try again.')
    })
  })
  .then(() => {
    return checkIfVerified(options)
  })
  .catch((err) => {
    log('An unexpected error occurred while verifying the Cypress executable:')
    log()
    log(err.stack)
    process.exit(1)
  })
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
  writeInstalledVersion,
}
