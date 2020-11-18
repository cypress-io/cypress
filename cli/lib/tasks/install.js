const _ = require('lodash')
const os = require('os')
const url = require('url')
const path = require('path')
const chalk = require('chalk')
const debug = require('debug')('cypress:cli')
const Listr = require('listr')
const verbose = require('@cypress/listr-verbose-renderer')
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

const getNpmArgv = () => {
  const json = process.env.npm_config_argv

  if (!json) {
    return
  }

  debug('found npm argv json %o', json)

  try {
    return JSON.parse(json).original || []
  } catch (e) {
    return []
  }
}

// attempt to discover the version specifier used to install Cypress
// for example: "^5.0.0", "https://cdn.cypress.io/...", ...
const getVersionSpecifier = (startDir = path.resolve(__dirname, '../..')) => {
  const argv = getNpmArgv()

  if (argv) {
    const tgz = _.find(argv, (t) => t.endsWith('cypress.tgz'))

    if (tgz) {
      return tgz
    }
  }

  const getVersionSpecifierFromPkg = (dir) => {
    debug('looking for versionSpecifier %o', { dir })

    const tryParent = () => {
      const parentPath = path.resolve(dir, '..')

      if (parentPath === dir) {
        debug('reached FS root with no versionSpecifier found')

        return
      }

      return getVersionSpecifierFromPkg(parentPath)
    }

    return fs.readJSON(path.join(dir, 'package.json'))
    .catch(() => ({}))
    .then((pkg) => {
      const specifier = _.chain(['dependencies', 'devDependencies', 'optionalDependencies'])
      .map((prop) => _.get(pkg, `${prop}.cypress`))
      .compact().first().value()

      return specifier || tryParent()
    })
  }

  // recurse through parent directories until package.json with `cypress` is found
  return getVersionSpecifierFromPkg(startDir)
  .then((versionSpecifier) => {
    debug('finished looking for versionSpecifier', { versionSpecifier })

    return versionSpecifier
  })
}

const betaNpmUrlRe = /^\/beta\/npm\/(?<version>[0-9.]+)\/(?<artifactSlug>[^/]+)\/cypress\.tgz$/

// convert a prerelease NPM package .tgz URL to the corresponding binary .zip URL
const getBinaryUrlFromPrereleaseNpmUrl = (npmUrl) => {
  let parsed

  try {
    parsed = url.parse(npmUrl)
  } catch (e) {
    return
  }

  const matches = betaNpmUrlRe.exec(parsed.pathname)

  if (parsed.hostname !== 'cdn.cypress.io' || !matches) {
    return
  }

  const { version, artifactSlug } = matches.groups

  parsed.pathname = `/beta/binary/${version}/${os.platform()}-${os.arch()}/${artifactSlug}/cypress.zip`

  return parsed.format()
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
  const downloadDestination = path.join(downloadDir, 'cypress.zip')
  const rendererOptions = getRendererOptions()

  // let the user know what version of cypress we're downloading!
  logger.log(`Installing Cypress ${chalk.gray(`(version: ${version})`)}`)
  logger.log()

  const tasks = new Listr([
    {
      title: util.titleize('Downloading Cypress'),
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
      title: util.titleize('Finishing Installation'),
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
  ], rendererOptions)

  // start the tasks!
  return Promise.resolve(tasks.run())
}

const start = (options = {}) => {
  debug('installing with options %j', options)

  _.defaults(options, {
    force: false,
  })

  const pkgVersion = util.pkgVersion()
  let needVersion = pkgVersion
  let binaryUrlOverride

  debug('version in package.json is', needVersion)

  // let this environment variable reset the binary version we need
  if (util.getEnv('CYPRESS_INSTALL_BINARY')) {
    // because passed file paths are often double quoted
    // and might have extra whitespace around, be robust and trim the string
    const trimAndRemoveDoubleQuotes = true
    const envVarVersion = util.getEnv('CYPRESS_INSTALL_BINARY', trimAndRemoveDoubleQuotes)

    debug('using environment variable CYPRESS_INSTALL_BINARY "%s"', envVarVersion)

    if (envVarVersion === '0') {
      debug('environment variable CYPRESS_INSTALL_BINARY = 0, skipping install')
      logger.log(
        stripIndent`
        ${chalk.yellow('Note:')} Skipping binary installation: Environment variable CYPRESS_INSTALL_BINARY = 0.`,
      )

      logger.log()

      return Promise.resolve()
    }

    binaryUrlOverride = envVarVersion
  }

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

  const installDir = state.getVersionDir(pkgVersion)
  const cacheDir = state.getCacheDir()
  const binaryDir = state.getBinaryDir(pkgVersion)

  return fs.ensureDirAsync(cacheDir)
  .catch({ code: 'EACCES' }, (err) => {
    return throwFormErrorText(errors.invalidCacheDirectory)(stripIndent`
    Failed to access ${chalk.cyan(cacheDir)}:

    ${err.message}
    `)
  })
  .then(() => {
    return Promise.all([
      state.getBinaryPkgAsync(binaryDir).then(state.getBinaryPkgVersion),
      getVersionSpecifier(),
    ])
  })
  .then(([binaryVersion, versionSpecifier]) => {
    if (!binaryUrlOverride && versionSpecifier) {
      const computedBinaryUrl = getBinaryUrlFromPrereleaseNpmUrl(versionSpecifier)

      if (computedBinaryUrl) {
        debug('computed binary url from version specifier %o', { computedBinaryUrl, needVersion })
        binaryUrlOverride = computedBinaryUrl
      }
    }

    needVersion = binaryUrlOverride || needVersion

    debug('installed version is', binaryVersion, 'version needed is', needVersion)

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

    if ((binaryVersion === needVersion) || !util.isSemver(needVersion)) {
      // our version matches, tell the user this is a noop
      alreadyInstalledMsg()

      return false
    }

    return true
  })
  .then((shouldInstall) => {
    // noop if we've been told not to download
    if (!shouldInstall) {
      debug('Not downloading or installing binary')

      return
    }

    if (needVersion !== pkgVersion) {
      logger.log(
        chalk.yellow(stripIndent`
          ${logSymbols.warning} Warning: Forcing a binary version different than the default.

            The CLI expected to install version: ${chalk.green(pkgVersion)}

            Instead we will install version: ${chalk.green(needVersion)}

            These versions may not work properly together.
        `),
      )

      logger.log()
    }

    // see if version supplied is a path to a binary
    return fs.pathExistsAsync(needVersion)
    .then((exists) => {
      if (exists) {
        return path.extname(needVersion) === '.zip' ? needVersion : false
      }

      const possibleFile = util.formAbsolutePath(needVersion)

      debug('checking local file', possibleFile, 'cwd', process.cwd())

      return fs.pathExistsAsync(possibleFile)
      .then((exists) => {
        // if this exists return the path to it
        // else false
        if (exists && path.extname(possibleFile) === '.zip') {
          return possibleFile
        }

        return false
      })
    })
    .then((pathToLocalFile) => {
      if (pathToLocalFile) {
        const absolutePath = path.resolve(needVersion)

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
        })], rendererOptions).run()
      }

      if (options.force) {
        debug('Cypress already installed at', installDir)
        debug('but the installation was forced')
      }

      debug('preparing to download and unzip version ', needVersion, 'to path', installDir)

      const downloadDir = os.tmpdir()

      return downloadAndUnzip({ version: needVersion, installDir, downloadDir })
    })
    // delay 1 sec for UX, unless we are testing
    .then(() => {
      return Promise.delay(1000)
    })
    .then(displayCompletionMsg)
  })
}

module.exports = {
  start,
  _getVersionSpecifier: getVersionSpecifier,
  _getBinaryUrlFromPrereleaseNpmUrl: getBinaryUrlFromPrereleaseNpmUrl,
}

const unzipTask = ({ zipFilePath, installDir, progress, rendererOptions }) => {
  return {
    title: util.titleize('Unzipping Cypress'),
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
