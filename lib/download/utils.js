const _ = require('lodash')
const chalk = require('chalk')
const cp = require('child_process')
const os = require('os')
const path = require('path')
const Promise = require('bluebird')
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
  process.exit()
}

const getInstallationDir = () => {
  return path.join(__dirname, 'dist')
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
  return path.join(getInstallationDir(), getPlatformExecutable().split("/")[0])
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
        child.on('close', xvfb.stop)
      }

      child.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(stderr))
        } else {
          resolve()
        }
      })
    })
  }

  if (needsXvfb) {
    return xvfb.start()
    .catch((err) => {
      log()
      log(chalk.bgRed.white(' -Error- '))
      log()
      log(chalk.red.underline('Could not start Cypress headlessly. Your CI provider must support XVFB.'))
      log(err.stack)
      process.exit(1)
    })
    .then(spawn)
  } else {
    return spawn()
  }
}

const checkIfVerified = () => {
  return getVerifiedVersion()
  .then((verifiedVersion) => {
    if (verifiedVersion !== packageVersion) {
      log('Verifying Cypress executable...')
      return runSmokeTest()
    }
  })
  .then(() => {
    log('Verified Cypress executable. Ready to run.')
    return writeVerifiedVersion(packageVersion)
  })
  .catch((err) => {
    //// probably failed due to a dependency failure
    //// write up a nice error message telling the user what they need to do
    //// list the dependencies they need
    //// maybe even list the commands they need to run
    //// - focus on Docker and Ubuntu
    //// link to doc for installing dependencies
    //// output OS and version for debugging purposes: https://www.npmjs.com/package/getos
    /// look at lib/api.coffee getos
    log('Failed to verify Cypress executable. The following error occurred:')
    log()
    log(err.stack)
  })
}

const verify = () => {
  return getInstalledVersion()
  .catch(() => {
    logAndFail('No version of Cypress executable installed. Run `cypress install` and try again.')
  })
  .then((installedVersion) => {
    if (installedVersion !== packageVersion) {
      logAndFail(`Installed version (${installedVersion}) does not match package version (${packageVersion}). Run \`cypress install\` and try again.`)
    }
  })
  .then(() => {
    return fs.statAsync(getPathToExecutable()).catch(() => {
      logAndFail('Cypress executable not found. Run `cypress install` and try again.')
    })
  })
  .then(checkIfVerified)
  .catch((err) => {
    log('An unexpected error occurred while verifying the Cypress executable:')
    log()
    log(err.stack)
    process.exit(1)
  })
}

module.exports = {
  ensureInstallationDir,
  getInstallationDir,
  getInstalledVersion,
  getPathToUserExecutable,
  getPathToExecutable,
  log,
  verify,
  writeInstalledVersion,
}
