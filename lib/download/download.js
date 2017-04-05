const chalk = require('chalk')
const _ = require('lodash')
const os = require('os')
const path = require('path')
const progress = require('request-progress')
const ProgressBar = require('progress')
const Promise = require('bluebird')
const request = require('request')
const url = require('url')

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
  version = version || process.env.CYPRESS_VERSION
  return version ? prepend(`desktop/${version}`) : prepend('desktop')
}

const download = (options) => {
  return new Promise((resolve, reject) => {
    const ascii = [
      chalk.white('  -'),
      chalk.blue('Downloading Cypress'),
      chalk.yellow('[:bar]'),
      chalk.white(':percent'),
      chalk.gray(':etas'),
    ]

    const bar = new ProgressBar(ascii.join(' '), {
      total: options.total,
      width: options.width,
    })

    // nuke the bar on error
    const terminate = (err) => {
      bar.clear = true
      bar.terminate()
      reject(err)
    }

    const req = request({
      url: getUrl(options.cypressVersion),
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
      if (diff) {
        bar.tick(diff)
      }

      resolve(options)
    })
  })
}

const logErr = (err) => {
  /* eslint-disable no-console */
  console.log('')
  console.log(chalk.bgRed.white(' -Error- '))
  console.log(chalk.red.underline('The Cypress App could not be downloaded.'))
  console.log('')
  console.log('URL:', chalk.blue(getUrl()))
  if (err.statusCode) {
    const msg = [err.statusCode, err.statusMessage].join(' - ')
    console.log('The server returned:', chalk.red(msg))
  } else {
    console.log(err.toString())
  }
  console.log('')
  process.exit(1)
  /* eslint-enable no-console */
}

const logFinish = (options) => {
  // console.error('--- log finish')
  /* eslint-disable no-console */
  console.log(
    chalk.white('  -'),
    chalk.blue('Finished Installing'),
    chalk.green(options.executable),
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

  return utils.ensureInstallationDir()
  .then(() => download(options))
  .catch(logErr)
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
