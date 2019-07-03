const arch = require('arch')
const la = require('lazy-ass')
const is = require('check-more-types')
const os = require('os')
const url = require('url')
const path = require('path')
const debug = require('debug')('cypress:cli')
const request = require('request')
const Promise = require('bluebird')
const requestProgress = require('request-progress')
const { stripIndent } = require('common-tags')

const { throwFormErrorText, errors } = require('../errors')
const fs = require('../fs')
const util = require('../util')

const defaultBaseUrl = 'https://download.cypress.io/'

const getRealOsArch = () => {
  // os.arch() returns the arch for which this node was compiled
  // we want the operating system's arch instead: x64 or x86

  const osArch = arch()

  if (osArch === 'x86') {
    // match process.platform output
    return 'ia32'
  }

  return osArch
}

const getBaseUrl = () => {
  if (util.getEnv('CYPRESS_DOWNLOAD_MIRROR')) {
    let baseUrl = util.getEnv('CYPRESS_DOWNLOAD_MIRROR')

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }

    return baseUrl
  }

  return defaultBaseUrl
}

const prepend = (urlPath) => {
  const endpoint = url.resolve(getBaseUrl(), urlPath)
  const platform = os.platform()
  const arch = getRealOsArch()

  return `${endpoint}?platform=${platform}&arch=${arch}`
}

const getUrl = (version) => {
  if (is.url(version)) {
    debug('version is already an url', version)

    return version
  }

  return version ? prepend(`desktop/${version}`) : prepend('desktop')
}

const statusMessage = (err) => {
  return (err.statusCode
    ? [err.statusCode, err.statusMessage].join(' - ')
    : err.toString())
}

const prettyDownloadErr = (err, version) => {
  const msg = stripIndent`
    URL: ${getUrl(version)}
    ${statusMessage(err)}
  `

  debug(msg)

  return throwFormErrorText(errors.failedDownload)(msg)
}

// downloads from given url
// return an object with
// {filename: ..., downloaded: true}
const downloadFromUrl = ({ url, downloadDestination, progress }) => {
  return new Promise((resolve, reject) => {
    debug('Downloading from', url)
    debug('Saving file to', downloadDestination)

    let redirectVersion

    const req = request({
      url,
      followRedirect (response) {
        const version = response.headers['x-version']

        debug('redirect version:', version)
        if (version) {
          // set the version in options if we have one.
          // this insulates us from potential redirect
          // problems where version would be set to undefined.
          redirectVersion = version
        }

        // yes redirect
        return true
      },
    })

    // closure
    let started = null

    requestProgress(req, {
      throttle: progress.throttle,
    })
    .on('response', (response) => {
      // start counting now once we've gotten
      // response headers
      started = new Date()

      // if our status code does not start with 200
      if (!/^2/.test(response.statusCode)) {
        debug('response code %d', response.statusCode)

        const err = new Error(
          stripIndent`
          Failed downloading the Cypress binary.
          Response code: ${response.statusCode}
          Response message: ${response.statusMessage}
        `
        )

        reject(err)
      }
    })
    .on('error', reject)
    .on('progress', (state) => {
      // total time we've elapsed
      // starting on our first progress notification
      const elapsed = new Date() - started

      // request-progress sends a value between 0 and 1
      const percentage = util.convertPercentToPercentage(state.percent)

      const eta = util.calculateEta(percentage, elapsed)

      // send up our percent and seconds remaining
      progress.onProgress(percentage, util.secsRemaining(eta))
    })
    // save this download here
    .pipe(fs.createWriteStream(downloadDestination))
    .on('finish', () => {
      debug('downloading finished')

      resolve(redirectVersion)
    })
  })
}

const start = ({ version, downloadDestination, progress }) => {
  if (!downloadDestination) {
    la(is.unemptyString(downloadDestination), 'missing download dir', arguments)
  }

  if (!progress) {
    progress = { onProgress: () => {
      return {}
    } }
  }

  const url = getUrl(version)

  progress.throttle = 100

  debug('needed Cypress version: %s', version)
  debug(`downloading cypress.zip to "${downloadDestination}"`)

  // ensure download dir exists
  return fs.ensureDirAsync(path.dirname(downloadDestination))
  .then(() => {
    return downloadFromUrl({ url, downloadDestination, progress })
  })
  .catch((err) => {
    return prettyDownloadErr(err, version)
  })
}

module.exports = {
  start,
  getUrl,
}
