const _ = require('lodash')
const os = require('os')
const path = require('path')
const progress = require('request-progress')
const Promise = require('bluebird')
const request = require('request')
const url = require('url')
const debug = require('debug')('cypress:cli')
const { stripIndent } = require('common-tags')
const is = require('check-more-types')

const { throwFormErrorText, errors } = require('../errors')
const fs = require('../fs')
const util = require('../util')
const info = require('./info')

const baseUrl = 'https://download.cypress.io/'

const prepend = urlPath => {
  const endpoint = url.resolve(baseUrl, urlPath)
  const platform = os.platform()
  const arch = os.arch()
  return `${endpoint}?platform=${platform}&arch=${arch}`
}

const getUrl = version => {
  if (is.url(version)) {
    debug('version is already an url', version)
    return version
  }
  return version ? prepend(`desktop/${version}`) : prepend('desktop')
}

const statusMessage = err =>
  (err.statusCode
    ? [err.statusCode, err.statusMessage].join(' - ')
    : err.toString())

const prettyDownloadErr = (err, version) => {
  const msg = stripIndent`
    URL: ${getUrl(version)}
    ${statusMessage(err)}
  `
  debug(msg)

  return throwFormErrorText(errors.failedDownload)(msg)
}

// attention:
// when passing relative path to NPM post install hook, the current working
// directory is set to the `node_modules/cypress` folder
// the user is probably passing relative path with respect to root package folder
function formAbsolutePath (filename) {
  if (path.isAbsolute(filename)) {
    return filename
  }
  return path.join(process.cwd(), '..', '..', filename)
}

// downloads from given url
// return an object with
// {filename: ..., downloaded: true}
const downloadFromUrl = options => {
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
      }
    })

    // closure
    let started = null

    progress(req, {
      throttle: options.throttle
    })
      .on('response', response => {
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
      .on('progress', state => {
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

        resolve({
          filename: options.downloadDestination,
          downloaded: true
        })
      })
  })
}

// returns an object with zip filename
// and a flag if the file was really downloaded
// or not. Maybe it was already there!
// {filename: ..., downloaded: true|false}
const download = (options = {}) => {
  if (!options.version) {
    debug('empty Cypress version to download, will try latest')
    return downloadFromUrl(options)
  }

  debug('need to download Cypress version %s', options.version)
  // first check the original filename
  return fs.pathExists(options.version).then(exists => {
    if (exists) {
      debug('found file right away', options.version)
      return {
        filename: options.version,
        downloaded: false
      }
    }

    const possibleFile = formAbsolutePath(options.version)
    debug('checking local file', possibleFile, 'cwd', process.cwd())
    return fs.pathExists(possibleFile).then(exists => {
      if (exists) {
        debug('found local file', possibleFile)
        debug('skipping download')
        return {
          filename: possibleFile,
          downloaded: false
        }
      } else {
        return downloadFromUrl(options)
      }
    })
  })
}

const start = options => {
  _.defaults(options, {
    version: null,
    throttle: 100,
    onProgress: () => {},
    downloadDestination: path.join(info.getInstallationDir(), 'cypress.zip')
  })

  // make sure our 'dist' installation dir exists
  return info
    .ensureInstallationDir()
    .then(() => {
      return download(options)
    })
    .catch(err => {
      return prettyDownloadErr(err, options.version)
    })
}

module.exports = {
  start,
  getUrl
}
