const _ = require('lodash')
const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))

const spawn = require('../exec/spawn')
const packageVersion = require('../../package').version

const log = (...messages) => {
  /* eslint-disable no-console */
  console.log('')
  console.log(...messages)
  console.log('')
  /* eslint-enable no-console */
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

const getInstallationDir = () => {
  return path.join(__dirname, 'dist')
}

const getInstalledVersion = () => {
  return getInfoFileContents().get('version')
}

const getVerifiedVersion = () => {
  return getInfoFileContents().get('verifiedVersion')
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
  return spawn.start(`--project ${path.resolve('./project')}`, {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  .then((sp) => {
    return new Promise((resolve, reject) => {
      let stderr = ''
      sp.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      sp.on('close', (code) => {
        if (code !== 0) {
          reject(stderr)
        } else {
          resolve()
        }
      })
    })
  })
  .then(() => {
    return writeVerifiedVersion(packageVersion)
  })
}

const checkIfVerified = () => {
  return getVerifiedVersion()
  .then((verifiedVersion) => {
    if (verifiedVersion !== packageVersion) {
      throw new Error('Thrown to be caught below and run smoke test')
    }
  })
  .catch(runSmokeTest)
  .then(() => {
    log('Verified Cypress executable. Ready to run.')
  })
  .catch((err) => {
    throw new Error(`Failed to verify Cypress executable. The following error occurred:\n\n${err.message}`)
  })
}

const verify = () => {
  log('Verifying Cypress executable...')

  return getInstalledVersion()
  .catch(() => {
    throw new Error('No version of Cypress executable installed. Run `cypress install` and then try again.')
  })
  .then((installedVersion) => {
    if (installedVersion !== packageVersion) {
      throw new Error(`Installed version (${installedVersion}) does not match package version (${packageVersion}). Run \`cypress install\` and then try again.`)
    }
  })
  .then(() => {
    return fs.statAsync(getPathToExecutable())
    .catch(function () {
      throw new Error('Cypress executable not found. Run `cypress install` and then try again.')
    })
  })
  .then(checkIfVerified)
  .catch((err) => {
    log(err.message)
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
