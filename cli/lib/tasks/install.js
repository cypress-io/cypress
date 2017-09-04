const _ = require('lodash')
const path = require('path')
const chalk = require('chalk')
const Listr = require('listr')
const { stripIndent } = require('common-tags')
const debug = require('debug')('cypress:cli')
const Promise = require('bluebird')
const fs = require('../fs')
const download = require('./download')
const util = require('../util')
const info = require('./info')
const unzip = require('./unzip')
const logger = require('../logger')

const hasSomethingToSay = (err) => err && err.message

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
    logger.log(chalk.yellow(stripIndent`
      It looks like you\'ve installed Cypress globally.

      This will work, but it'\s not recommended.

      The recommended way to install Cypress is as a devDependency per project.

      You should probably run these commands:

        - ${chalk.cyan('npm uninstall -g cypress')}
        - ${chalk.cyan('npm install --save-dev cypress')}
    `))

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
  logger.log(chalk.yellow(`Installing Cypress ${chalk.gray(`(version: ${version})`)}`))
  logger.log()

  const titleize = (...args) => {
    // prepend first arg with space
    // and pad so that all messages line up
    args[0] = _.padEnd(` ${args[0]}`, 24)

    // get rid of any falsy values
    args = _.compact(args)

    return chalk.blue(...args)
  }

  const progessify = (title, task) => {
    // return higher order function
    return (percentComplete, remaining) => {
      percentComplete = chalk.white(` ${percentComplete}%`)

      // pluralize seconds remaining
      remaining = chalk.gray(`${remaining}s`)

      task.title = titleize(title, percentComplete, remaining)
    }
  }

  const tasks = new Listr([
    {
      title: titleize('Downloading Cypress'),
      task: (ctx, task) => {
        // as our download progresses indicate the status
        options.onProgress = progessify('Downloading Cypress', task)

        return download.start(options)
        .then((downloadDestination) => {
          // save the download destination for unzipping
          ctx.downloadDestination = downloadDestination
        })
      },
    },
    {
      title: titleize('Unzipping Cypress'),
      task: (ctx, task) => {
        // as our unzip progresses indicate the status
        options.downloadDestination = ctx.downloadDestination
        options.onProgress = progessify('Unzipping Cypress', task)

        return unzip.start(options)
      },
    },
    {
      title: titleize('Finishing Installation'),
      task: (ctx, task) => {
        const { downloadDestination } = options

        debug('removing zip file %s', downloadDestination)

        return fs.removeAsync(downloadDestination)
        .then(() => {
          const dir = info.getPathToUserExecutableDir()

          task.title = titleize('Finishing Installation', chalk.gray(dir))

          return info.writeInstalledVersion(version)
        })
      },
    },
  ])

  // start the tasks!
  return tasks.run()
}

const install = (options = {}) => {
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
  .catch(() => {
    throw new Error('Cypress executable was not found.')
  })
  .then((installedVersion) => {
    debug('installed version is', installedVersion, 'version needed is', needVersion)

    if (options.force) {
      return info.clearVersionState()
      .then(() => {
        throw new Error('')
      })
    } else if (installedVersion === needVersion) {
      // our version matches, tell the user this is a noop
      return alreadyInstalledMsg(installedVersion, needVersion)

    } else if (!installedVersion) {
      // logger.log('Could not find installed Cypress')

      return info.clearVersionState()
      .then(() => {
        throw new Error('')
      })
    } else {
      throw new Error(`Installed version (${installedVersion}) does not match needed version (${needVersion}).`)
    }
  })
  .catch((err) => {
    if (hasSomethingToSay(err)) {
      logger.log(err.message)
    }

    // TODO: what to do about this? let's just not support it
    // let needVersion be a path to a real cypress binary
    // instead of a version we download from the internet
    return fs.statAsync(needVersion)
    .then(() => {
      logger.log('Installing local Cypress binary from %s', needVersion)

      // TODO: move all this shit
      return unzip.start({
        zipDestination: needVersion,
        destination: info.getInstallationDir(),
        executable: info.getPathToUserExecutableDir(),
      })
      .then(() => info.writeInstalledVersion('unknown'))
    })
    .catch(() => {
      debug('preparing to download and unzip version', needVersion)

      // else go out and download it from the interwebz
      // TODO why do we have this?
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
  install,
}
