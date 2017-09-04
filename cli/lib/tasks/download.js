const _ = require('lodash')
const os = require('os')
const path = require('path')
const progress = require('request-progress')
const Promise = require('bluebird')
const request = require('request')
const url = require('url')
const debug = require('debug')('cypress:cli')
const { stripIndent } = require('common-tags')

const { throwFormErrorText, errors } = require('../errors')
const fs = require('../fs')
const util = require('../util')
const info = require('./info')

const baseUrl = 'https://download.cypress.io/'

const getOs = () => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin': return 'mac'
    case 'linux': return 'linux64'
    case 'win32': return 'win'
    // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

const prepend = (urlPath) => {
  return `${url.resolve(baseUrl, urlPath)}?os=${getOs()}`
}

const getUrl = (version) => {
  return version ? prepend(`desktop/${version}`) : prepend('desktop')
}

const statusMessage = (err) =>
  err.statusCode ? [err.statusCode, err.statusMessage].join(' - ') : err.toString()

const prettyDownloadErr = (err, version) => {
  const msg = stripIndent`
    URL: ${getUrl(version)}
    Server response: ${statusMessage(err)}
  `
  debug(msg)

  return throwFormErrorText(errors.failedDownload(new Error(msg)))
}

const download = (options = {}) => {
  if (!options.version) {
    debug('empty Cypress version to download')
  }

  return new Promise((resolve, reject) => {
    const url = getUrl(options.version)

    debug('Downloading from', url)
    debug('Saving file to', options.downloadDestination)

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

    // closure
    let started = null

    progress(req, {
      throttle: options.throttle,
    })
    .on('response', (response) => {
      // start counting now once we've gotten
      // response headers
      started = new Date

      // if our status code does not start with 200
      if (!(/^2/.test(response.statusCode))) {
        debug('response code %d', response.statusCode)

        const err = new Error(stripIndent`
          Failing downloading the Cypress binary.
          Response code: ${response.statusCode}
          Response message: ${response.statusMessage}
        `)

        reject(err)
      }
    })

    .on('error', reject)

    .on('progress', (state) => {
      // total time we've elapsed
      // starting on our first progress notification
      const elapsed = new Date() - started

      const eta = util.calculateEta(state.percent, elapsed)

      // send up our percent and seconds remaining
      options.onProgress(state.percent, util.secsRemaining(eta))
    })

    // save this download here
    .pipe(fs.createWriteStream(options.downloadDestination))

    .on('finish', () => {
      debug('downloading finished')

      resolve(options.downloadDestination)
    })
  })
}

const start = (options) => {
  _.defaults(options, {
    version: null,
    throttle: 100,
    onProgress: () => {},
    downloadDestination: path.join(info.getInstallationDir(), 'cypress.zip'),
  })

  // make sure our 'dist' installation dir exists
  return info.ensureInstallationDir()
  .then(() => {
    return download(options)
  })
  .catch((err) => {
    return prettyDownloadErr(err, options.version)
  })
}

module.exports = {
  start,
}
