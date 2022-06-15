const _ = require('lodash')
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const debug = require('debug')('cypress:cli')
const { Listr } = require('listr2')
const Promise = require('bluebird')
const logSymbols = require('log-symbols')
const { stripIndent } = require('common-tags')
const fs = require('../fs')
const download = require('./download')
const util = require('../util')
const state = require('./state')
const unzip = require('./unzip')
const logger = require('../logger')
const { throwFormErrorText, errors } = require('../errors')
const verbose = require('../VerboseRenderer')

const { buildInfo, version } = require('../../package.json')

function _getBinaryUrlFromBuildInfo (arch, { commitSha, commitBranch }) {
  return `https://cdn.cypress.io/beta/binary/${version}/${os.platform()}-${arch}/${commitBranch}-${commitSha}/cypress.zip`
}

const alreadyInstalledMsg = () => {
  if (!util.isPostInstall()) {
    logger.log(stripIndent`
      Skipping installation:

        Pass the ${chalk.yellow('--force')} option if you'd like to reinstall anyway.
    `)
  }
}

const displayCompletionMsg = () => {
  // check here to see if we are globally installed
  if (util.isInstalledGlobally()) {
    // if we are display a warning
    logger.log()
    logger.warn(stripIndent`
      ${logSymbols.warning} Warning: It looks like you\'ve installed Cypress globally.

        This will work, but it'\s not recommended.

        The recommended way to install Cypress is as a devDependency per project.

        You should probably run these commands:

        - ${chalk.cyan('npm uninstall -g cypress')}
        - ${chalk.cyan('npm install --save-dev cypress')}
    `)

    return
  }

  logger.log()
  logger.log(
    'You can now open Cypress by running:',
    chalk.cyan(path.join('node_modules', '.bin', 'cypress'), 'open'),
  )

  logger.log()
  logger.log(chalk.grey('https://on.cypress.io/installing-cypress'))
  logger.log()
}

const downloadAndUnzip = ({ version, installDir, downloadDir }) => {
  const progress = {
    throttle: 100,
    onProgress: null,
  }
  const downloadDestination = path.join(downloadDir, `cypress-${process.pid}.zip`)
  const rendererOptions = getRendererOptions()

  // let the user know what version of cypress we're downloading!
  logger.log(`Installing Cypress ${chalk.gray(`(version: ${version})`)}`)
  logger.log()

  const tasks = new Listr([
    {
      options: { title: util.titleize('Downloading Cypress') },
      task: (ctx, task) => {
        // as our download progresses indicate the status
        progress.onProgress = progessify(task, 'Downloading Cypress')

        return download.start({ version, downloadDestination, progress })
        .then((redirectVersion) => {
          if (redirectVersion) version = redirectVersion

          debug(`finished downloading file: ${downloadDestination}`)
        })
        .then(() => {
          // save the download destination for unzipping
          util.setTaskTitle(
            task,
            util.titleize(chalk.green('Downloaded Cypress')),
            rendererOptions.renderer,
          )
        })
      },
    },
    unzipTask({
      progress,
      zipFilePath: downloadDestination,
      installDir,
      rendererOptions,
    }),
    {
      options: { title: util.titleize('Finishing Installation') },
      task: (ctx, task) => {
        const cleanup = () => {
          debug('removing zip file %s', downloadDestination)

          return fs.removeAsync(downloadDestination)
        }

        return cleanup()
        .then(() => {
          debug('finished installation in', installDir)

          util.setTaskTitle(
            task,
            util.titleize(chalk.green('Finished Installation'), chalk.gray(installDir)),
            rendererOptions.renderer,
          )
        })
      },
    },
  ], { rendererOptions })

  // start the tasks!
  return Promise.resolve(tasks.run())
}

const validateOS = () => {
  return util.getPlatformInfo().then((platformInfo) => {
    return platformInfo.match(/(win32-x64|linux-x64|linux-arm64|darwin-x64|darwin-arm64)/)
  })
}

/**
 * Returns the version to install - either a string like `1.2.3` to be fetched
 * from the download server or a file path or HTTP URL.
 */
function getVersionOverride ({ arch, envVarVersion, buildInfo }) {
  // let this environment variable reset the binary version we need
  if (envVarVersion) {
    return envVarVersion
  }

  if (buildInfo && !buildInfo.stable) {
    logger.log(
      chalk.yellow(stripIndent`
        ${logSymbols.warning} Warning: You are installing a pre-release build of Cypress.

        Bugs may be present which do not exist in production builds.

        This build was created from:
          * Commit SHA: ${buildInfo.commitSha}
          * Commit Branch: ${buildInfo.commitBranch}
          * Commit Timestamp: ${buildInfo.commitDate}
      `),
    )

    logger.log()

    return _getBinaryUrlFromBuildInfo(arch, buildInfo)
  }
}

function getEnvVarVersion () {
  if (!util.getEnv('CYPRESS_INSTALL_BINARY')) return

  // because passed file paths are often double quoted
  // and might have extra whitespace around, be robust and trim the string
  const trimAndRemoveDoubleQuotes = true
  const envVarVersion = util.getEnv('CYPRESS_INSTALL_BINARY', trimAndRemoveDoubleQuotes)

  debug('using environment variable CYPRESS_INSTALL_BINARY "%s"', envVarVersion)

  return envVarVersion
}

const start = async (options = {}) => {
  debug('installing with options %j', options)

  const envVarVersion = getEnvVarVersion()

  if (envVarVersion === '0') {
    debug('environment variable CYPRESS_INSTALL_BINARY = 0, skipping install')
    logger.log(
      stripIndent`
        ${chalk.yellow('Note:')} Skipping binary installation: Environment variable CYPRESS_INSTALL_BINARY = 0.`,
    )

    logger.log()

    return
  }

  _.defaults(options, {
    force: false,
    buildInfo,
  })

  if (util.getEnv('CYPRESS_CACHE_FOLDER')) {
    const envCache = util.getEnv('CYPRESS_CACHE_FOLDER')

    logger.log(
      stripIndent`
        ${chalk.yellow('Note:')} Overriding Cypress cache directory to: ${chalk.cyan(envCache)}

              Previous installs of Cypress may not be found.
      `,
    )

    logger.log()
  }

  const pkgVersion = util.pkgVersion()
  const arch = await util.getRealArch()
  const versionOverride = getVersionOverride({ arch, envVarVersion, buildInfo: options.buildInfo })
  const versionToInstall = versionOverride || pkgVersion

  debug('version in package.json is %s, version to install is %s', pkgVersion, versionToInstall)

  const installDir = state.getVersionDir(pkgVersion, options.buildInfo)
  const cacheDir = state.getCacheDir()
  const binaryDir = state.getBinaryDir(pkgVersion)

  if (!(await validateOS())) {
    return throwFormErrorText(errors.invalidOS)()
  }

  await fs.ensureDirAsync(cacheDir)
  .catch({ code: 'EACCES' }, (err) => {
    return throwFormErrorText(errors.invalidCacheDirectory)(stripIndent`
    Failed to access ${chalk.cyan(cacheDir)}:

    ${err.message}
    `)
  })

  const binaryPkg = await state.getBinaryPkgAsync(binaryDir)
  const binaryVersion = await state.getBinaryPkgVersion(binaryPkg)

  const shouldInstall = () => {
    if (!binaryVersion) {
      debug('no binary installed under cli version')

      return true
    }

    logger.log()
    logger.log(stripIndent`
      Cypress ${chalk.green(binaryVersion)} is installed in ${chalk.cyan(installDir)}
      `)

    logger.log()

    if (options.force) {
      debug('performing force install over existing binary')

      return true
    }

    if ((binaryVersion === versionToInstall) || !util.isSemver(versionToInstall)) {
      // our version matches, tell the user this is a noop
      alreadyInstalledMsg()

      return false
    }

    return true
  }

  // noop if we've been told not to download
  if (!shouldInstall()) {
    return debug('Not downloading or installing binary')
  }

  if (envVarVersion) {
    logger.log(
      chalk.yellow(stripIndent`
        ${logSymbols.warning} Warning: Forcing a binary version different than the default.

          The CLI expected to install version: ${chalk.green(pkgVersion)}

          Instead we will install version: ${chalk.green(versionToInstall)}

          These versions may not work properly together.
      `),
    )

    logger.log()
  }

  const getLocalFilePath = async () => {
    // see if version supplied is a path to a binary
    if (await fs.pathExistsAsync(versionToInstall)) {
      return path.extname(versionToInstall) === '.zip' ? versionToInstall : false
    }

    const possibleFile = util.formAbsolutePath(versionToInstall)

    debug('checking local file', possibleFile, 'cwd', process.cwd())

    // if this exists return the path to it
    // else false
    if ((await fs.pathExistsAsync(possibleFile)) && path.extname(possibleFile) === '.zip') {
      return possibleFile
    }

    return false
  }

  const pathToLocalFile = await getLocalFilePath()

  if (pathToLocalFile) {
    const absolutePath = path.resolve(versionToInstall)

    debug('found local file at', absolutePath)
    debug('skipping download')

    const rendererOptions = getRendererOptions()

    return new Listr([unzipTask({
      progress: {
        throttle: 100,
        onProgress: null,
      },
      zipFilePath: absolutePath,
      installDir,
      rendererOptions,
    })], { rendererOptions }).run()
  }

  if (options.force) {
    debug('Cypress already installed at', installDir)
    debug('but the installation was forced')
  }

  debug('preparing to download and unzip version ', versionToInstall, 'to path', installDir)

  const downloadDir = os.tmpdir()

  await downloadAndUnzip({ version: versionToInstall, installDir, downloadDir })

  // delay 1 sec for UX, unless we are testing
  await Promise.delay(1000)

  displayCompletionMsg()
}

module.exports = {
  start,
  _getBinaryUrlFromBuildInfo,
}

const unzipTask = ({ zipFilePath, installDir, progress, rendererOptions }) => {
  return {
    options: { title: util.titleize('Unzipping Cypress') },
    task: (ctx, task) => {
    // as our unzip progresses indicate the status
      progress.onProgress = progessify(task, 'Unzipping Cypress')

      return unzip.start({ zipFilePath, installDir, progress })
      .then(() => {
        util.setTaskTitle(
          task,
          util.titleize(chalk.green('Unzipped Cypress')),
          rendererOptions.renderer,
        )
      })
    },
  }
}

const progessify = (task, title) => {
  // return higher order function
  return (percentComplete, remaining) => {
    percentComplete = chalk.white(` ${percentComplete}%`)

    // pluralize seconds remaining
    remaining = chalk.gray(`${remaining}s`)

    util.setTaskTitle(
      task,
      util.titleize(title, percentComplete, remaining),
      getRendererOptions().renderer,
    )
  }
}

// if we are running in CI then use
// the verbose renderer else use
// the default
const getRendererOptions = () => {
  let renderer = util.isCi() ? verbose : 'default'

  if (logger.logLevel() === 'silent') {
    renderer = 'silent'
  }

  return {
    renderer,
  }
}
