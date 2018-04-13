const _ = require('lodash')
const path = require('path')
const chalk = require('chalk')
const Listr = require('listr')
const verbose = require('@cypress/listr-verbose-renderer')
const { stripIndent } = require('common-tags')
const debug = require('debug')('cypress:cli')
const Promise = require('bluebird')
const fs = require('../fs')
const download = require('./download')
const util = require('../util')
const info = require('./info')
const unzip = require('./unzip')
const logger = require('../logger')
const la = require('lazy-ass')
const is = require('check-more-types')
// const cachedir = require('cachedir')

const alreadyInstalledMsg = (installedVersion, needVersion) => {
  logger.log(chalk.yellow(stripIndent`
    Cypress ${chalk.cyan(needVersion)} is already installed. Skipping installation.
  `))

  logger.log()

  logger.log(chalk.gray(stripIndent`
    Pass the ${chalk.white('--force')} option if you'd like to reinstall anyway.
  `))
}

const displayCompletionMsg = () => {
  logger.log()

  // check here to see if we are globally installed
  if (util.isInstalledGlobally()) {
    // if we are display a warning
    logger.warn(stripIndent`
      It looks like you\'ve installed Cypress globally.

      This will work, but it'\s not recommended.

      The recommended way to install Cypress is as a devDependency per project.

      You should probably run these commands:

        - ${chalk.cyan('npm uninstall -g cypress')}
        - ${chalk.cyan('npm install --save-dev cypress')}
    `)

    return
  }

  logger.log(
    chalk.yellow('You can now open Cypress by running:'),
    chalk.cyan(path.join('node_modules', '.bin', 'cypress'), 'open')
  )

  logger.log()

  logger.log(
    chalk.yellow('https://on.cypress.io/installing-cypress')
  )
}

const downloadAndUnzip = (version) => {
  const options = {
    version,
  }

  // let the user know what version of cypress we're downloading!
  const message = chalk.yellow(`Installing Cypress ${chalk.gray(`(version: ${version})`)}`)
  logger.log(message)
  logger.log()

  const progessify = (task, title) => {
    // return higher order function
    return (percentComplete, remaining) => {
      percentComplete = chalk.white(` ${percentComplete}%`)

      // pluralize seconds remaining
      remaining = chalk.gray(`${remaining}s`)

      util.setTaskTitle(
        task,
        util.titleize(title, percentComplete, remaining),
        rendererOptions.renderer
      )
    }
  }

  // if we are running in CI then use
  // the verbose renderer else use
  // the default
  const rendererOptions = {
    renderer: util.isCi() ? verbose : 'default',
  }

  const tasks = new Listr([
    {
      title: util.titleize('Downloading Cypress'),
      task: (ctx, task) => {
        // as our download progresses indicate the status
        options.onProgress = progessify(task, 'Downloading Cypress')

        return download.start(options)
        .then(({ filename, downloaded }) => {
          // save the download destination for unzipping
          ctx.downloadDestination = filename
          ctx.downloaded = downloaded

          util.setTaskTitle(
            task,
            util.titleize(chalk.green('Downloaded Cypress')),
            rendererOptions.renderer
          )
        })
      },
    },
    {
      title: util.titleize('Unzipping Cypress'),
      task: (ctx, task) => {
        // as our unzip progresses indicate the status
        options.downloadDestination = ctx.downloadDestination
        options.onProgress = progessify(task, 'Unzipping Cypress')

        return unzip.start(options)
        .then(() => {
          util.setTaskTitle(
            task,
            util.titleize(chalk.green('Unzipped Cypress')),
            rendererOptions.renderer
          )
        })
      },
    },
    {
      title: util.titleize('Finishing Installation'),
      task: (ctx, task) => {
        const { downloadDestination, version } = options
        la(is.unemptyString(downloadDestination), 'missing download destination', options)
        la(is.bool(ctx.downloaded), 'missing downloaded flag', ctx)

        const removeFile = () => {
          debug('removing zip file %s', downloadDestination)
          return fs.removeAsync(downloadDestination)
        }
        const skipFileRemoval = () => {
          debug('not removing file %s', downloadDestination)
          debug('because it was not downloaded (probably was local file already)')
          return Promise.resolve()
        }
        const cleanup = ctx.downloaded ? removeFile : skipFileRemoval

        return cleanup()
        .then(() => {
          const dir = info.getPathToUserExecutableDir()
          debug('finished installation in', dir)

          util.setTaskTitle(
            task,
            util.titleize(chalk.green('Finished Installation'), chalk.gray(dir)),
            rendererOptions.renderer
          )

          return info.writeInstalledVersion(version)
        })
      },
    },
  ], rendererOptions)

  // start the tasks!
  return tasks.run()
}

const start = (options = {}) => {
  if (process.env.CYPRESS_SKIP_BINARY_INSTALL) {
    logger.log(
      chalk.yellow('Skipping binary installation. Env var \'CYPRESS_SKIP_BINARY_INSTALL\' was found.')
    )
    return Promise.resolve()
  }

  debug('installing with options %j', options)

  _.defaults(options, {
    force: false,
  })

  let needVersion = util.pkgVersion()

  // let this env var reset the binary version we need
  if (process.env.CYPRESS_BINARY_VERSION) {
    const envVarVersion = process.env.CYPRESS_BINARY_VERSION

    // if this doesn't match the expected version
    // then print warning to the user
    if (envVarVersion !== needVersion) {
      debug('using env var CYPRESS_BINARY_VERSION %s', needVersion)
      logger.log(
        chalk.yellow(stripIndent`
          Forcing a binary version different than the default.

          The CLI expected to install version: ${chalk.cyan(needVersion)}

          Instead we will install version: ${chalk.cyan(envVarVersion)}

          Note: there is no guarantee these versions will work properly together.
        `)
      )
      logger.log('')

      // reset the version to the env var version
      needVersion = envVarVersion
    }
  }

  return info.getInstalledVersion()
  .catchReturn(null)
  .then((installedVersion) => {
    debug('installed version is', installedVersion, 'version needed is', needVersion)

    if (options.force) {
      return info.clearVersionState()
    }

    if (installedVersion === needVersion) {
      // our version matches, tell the user this is a noop
      alreadyInstalledMsg(installedVersion, needVersion)

      return false
    }

    if (!installedVersion) {
      return info.clearVersionState()
    }

    logger.warn(stripIndent`
      Installed version ${chalk.cyan(`(${installedVersion})`)} does not match needed version ${chalk.cyan(`(${needVersion})`)}.
    `)

    logger.log()
  })
  .then((ret) => {
    // noop if we've been told not to download
    if (ret === false) {
      return
    }

    // TODO: what to do about this? let's just not support it
    // let needVersion be a path to a real cypress binary
    // instead of a version we download from the internet
    return fs.statAsync(needVersion)
    .then(() => {
      logger.log('Installing local Cypress binary from %s', needVersion)

      // TODO: move all this shit, it doesn't work as is now anyway
      return unzip.start({
        zipDestination: needVersion,
        destination: info.getInstallationDir(),
        executable: info.getPathToUserExecutableDir(),
      })
      .then(() => info.writeInstalledVersion('unknown'))
    })
    .catch(() => {
      debug('preparing to download and unzip version', needVersion)

      return downloadAndUnzip(needVersion)
      .then(() => {
        // wait 1 second for a good user experience
        return Promise.delay(1000)
      })
      .then(displayCompletionMsg)
    })
  })
}

module.exports = {
  start,
}
