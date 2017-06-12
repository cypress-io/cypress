const chalk = require('chalk')
const _ = require('lodash')
const os = require('os')
const path = require('path')
const progress = require('request-progress')
const Promise = require('bluebird')
const request = require('request')
const url = require('url')
const debug = require('debug')('cypress:cli')
const { formErrorText, errors } = require('./errors')
const { stripIndent } = require('common-tags')
const R = require('ramda')

const unzip = require('./unzip')
const utils = require('./utils')

const fs = Promise.promisifyAll(require('fs-extra'))

const baseUrl = 'https://download.cypress.io/'

const getOs = () => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin': return 'mac'
    case 'linux': return 'linux64'
    case 'win32': return 'win'
    default: throw new Error(`Platform: '${platform}' is not supported.`)
  }
}

const prepend = (urlPath) => {
  return `${url.resolve(baseUrl, urlPath)}?os=${getOs()}`
}

const getUrl = (version) => {
  return version ? prepend(`desktop/${version}`) : prepend('desktop')
}

const download = (options = {}) => {
  if (!options.version) {
    debug('empty Cypress version to download')
  }

  return new Promise((resolve, reject) => {
    const barOptions = R.pick(['total', 'width'], options)
    const bar = utils.getProgressBar('Downloading Cypress', barOptions)

    // nuke the bar on error
    const terminate = (err) => {
      bar.clear = true
      bar.terminate()
      reject(err)
    }

    const url = getUrl(options.cypressVersion)
    debug('Downloading from %s', url)

    const req = request({
      url,
      followRedirect (response) {
        const version = response.headers['x-version']
        if (version) {
          // set the version in options if we have one.
          // this insulates us from potential redirect
          // problems where version would be set to undefined.
          options.version = version
        }

        // yes redirect
        return true
      },
    })

    let percent = options.percent

    progress(req, {
      throttle: options.throttle,
    })
    .on('response', (response) => {
      // if our status code doesnt start with 200
      if (!(/^2/.test(response.statusCode))) {
        terminate(_.pick(response, 'statusCode', 'statusMessage'))
      }
    })
    .on('error', terminate)
    .on('progress', (state) => {
      //// always subtract the previous percent amount since our progress
      //// notifications are only the total progress, and our progress bar
      //// expects the delta
      const current = state.percent - percent
      percent = state.percent

      bar.tick(current)
    })
    .pipe(fs.createWriteStream(options.zipDestination))
    .on('finish', () => {
      // make sure we get to 100% on the progress bar
      const diff = options.total - percent
      debug('download finish, options.total %d percent %d', options.total, percent)
      if (diff) {
        bar.tick(diff)
      }

      resolve(options)
    })
  })
}

const statusMessage = (err) =>
  err.statusCode ? [err.statusCode, err.statusMessage].join(' - ') : err.toString()

const logErr = (options) => (err) => {
  const msg = stripIndent`
    URL: ${getUrl(options.version)}
    Server response: ${statusMessage(err)}
  `
  return formErrorText(errors.failedDownload, new Error(msg))
    .then(console.log) //eslint-disable-line no-console
    .then(process.exit(1))
}

const logFinish = (options) => {
  const relativeExecutable = path.relative(process.cwd(), options.executable)

  /* eslint-disable no-console */
  console.log(
    chalk.white('  -'),
    chalk.blue('Finished Installing'),
    chalk.green(relativeExecutable),
    chalk.gray(`(version: ${options.version})`)
  )
  /* eslint-enable no-console */
}

const displayOpeningApp = () => {
  //// TODO: this isn't necessarily true if installed locally
  utils.log(
    chalk.yellow('  You can now open Cypress by running:'),
    chalk.cyan('cypress open')
  )
}

const finish = (options) => {
  return unzip.cleanup(options)
  .then(() => {
    logFinish(options)
    if (options.displayOpen) {
      displayOpeningApp()
    }
    return utils.writeInstalledVersion(options.version)
  })
}

const start = (options) => {
  _.defaults(options, {
    displayOpen: true,
    version: null,
    cypressVersion: null,
    percent: 0,
    current: 0,
    total: 100,
    width: 30,
    throttle: 100,
    zipDestination: path.join(utils.getInstallationDir(), 'cypress.zip'),
    destination: utils.getInstallationDir(),
    executable: utils.getPathToUserExecutable(),
  })
  debug('zip destination %s', options.zipDestination)

  return utils.ensureInstallationDir()
  .then(() => download(options))
  .catch(logErr(options))
  .then(unzip.start)
  .catch((err) => {
    unzip.logErr(err)
    process.exit(1)
  })
  .then(() => finish(options))
}

module.exports = {
  start,
}
