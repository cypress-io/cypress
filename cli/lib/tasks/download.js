const arch = require('arch')
const la = require('lazy-ass')
const is = require('check-more-types')
const os = require('os')
const url = require('url')
const path = require('path')
const debug = require('debug')('cypress:cli')
const request = require('@cypress/request')
const Promise = require('bluebird')
const requestProgress = require('request-progress')
const { stripIndent } = require('common-tags')

const { throwFormErrorText, errors } = require('../errors')
const fs = require('../fs')
const util = require('../util')

const defaultBaseUrl = 'https://download.cypress.io/'

const getProxyUrl = () => {
  return process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.npm_config_https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.npm_config_proxy ||
    null
}

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

/**
 * Checks checksum and file size for the given file. Allows both
 * values or just one of them to be checked.
 */
const verifyDownloadedFile = (filename, expectedSize, expectedChecksum) => {
  if (expectedSize && expectedChecksum) {
    debug('verifying checksum and file size')

    return Promise.join(
      util.getFileChecksum(filename),
      util.getFileSize(filename),
      (checksum, filesize) => {
        if (checksum === expectedChecksum && filesize === expectedSize) {
          debug('downloaded file has the expected checksum and size ✅')

          return
        }

        debug('raising error: checksum or file size mismatch')
        const text = stripIndent`
          Corrupted download

          Expected downloaded file to have checksum: ${expectedChecksum}
          Computed checksum: ${checksum}

          Expected downloaded file to have size: ${expectedSize}
          Computed size: ${filesize}
        `

        debug(text)

        throw new Error(text)
      },
    )
  }

  if (expectedChecksum) {
    debug('only checking expected file checksum %d', expectedChecksum)

    return util.getFileChecksum(filename)
    .then((checksum) => {
      if (checksum === expectedChecksum) {
        debug('downloaded file has the expected checksum ✅')

        return
      }

      debug('raising error: file checksum mismatch')
      const text = stripIndent`
        Corrupted download

        Expected downloaded file to have checksum: ${expectedChecksum}
        Computed checksum: ${checksum}
      `

      throw new Error(text)
    })
  }

  if (expectedSize) {
    // maybe we don't have a checksum, but at least CDN returns content length
    // which we can check against the file size
    debug('only checking expected file size %d', expectedSize)

    return util.getFileSize(filename)
    .then((filesize) => {
      if (filesize === expectedSize) {
        debug('downloaded file has the expected size ✅')

        return
      }

      debug('raising error: file size mismatch')
      const text = stripIndent`
          Corrupted download

          Expected downloaded file to have size: ${expectedSize}
          Computed size: ${filesize}
        `

      throw new Error(text)
    })
  }

  debug('downloaded file lacks checksum or size to verify')

  return Promise.resolve()
}

// downloads from given url
// return an object with
// {filename: ..., downloaded: true}
const downloadFromUrl = ({ url, downloadDestination, progress }) => {
  return new Promise((resolve, reject) => {
    const proxy = getProxyUrl()

    debug('Downloading package', {
      url,
      proxy,
      downloadDestination,
    })

    let redirectVersion

    const req = request({
      url,
      proxy,
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
    let expectedSize
    let expectedChecksum

    requestProgress(req, {
      throttle: progress.throttle,
    })
    .on('response', (response) => {
      // we have computed checksum and filesize during test runner binary build
      // and have set it on the S3 object as user meta data, available via
      // these custom headers "x-amz-meta-..."
      // see https://github.com/cypress-io/cypress/pull/4092
      expectedSize = response.headers['x-amz-meta-size'] ||
        response.headers['content-length']

      expectedChecksum = response.headers['x-amz-meta-checksum']

      if (expectedChecksum) {
        debug('expected checksum %s', expectedChecksum)
      }

      if (expectedSize) {
        // convert from string (all Amazon custom headers are strings)
        expectedSize = Number(expectedSize)
        debug('expected file size %d', expectedSize)
      }

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
        `,
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

      verifyDownloadedFile(downloadDestination, expectedSize, expectedChecksum)
      .then(() => {
        return resolve(redirectVersion)
      }, reject)
    })
  })
}

/**
 * Download Cypress.zip from external url to local file.
 * @param [string] version Could be "3.3.0" or full URL
 * @param [string] downloadDestination Local filename to save as
 */
const start = (opts) => {
  let { version, downloadDestination, progress } = opts

  if (!downloadDestination) {
    la(is.unemptyString(downloadDestination), 'missing download dir', opts)
  }

  if (!progress) {
    progress = { onProgress: () => {
      return {}
    } }
  }

  const url = getUrl(version)

  progress.throttle = 100

  debug('needed Cypress version: %s', version)
  debug('source url %s', url)
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
  getProxyUrl,
}
