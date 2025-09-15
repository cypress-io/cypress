import la from 'lazy-ass'
import os from 'os'
import url from 'url'
import path from 'path'
import Debug from 'debug'
import request from '@cypress/request'
import Bluebird from 'bluebird'
import requestProgress from 'request-progress'
import { stripIndent } from 'common-tags'
import { getProxyForUrl } from 'proxy-from-env'
import { throwFormErrorText, errors } from '../errors'
import fs from 'fs-extra'
import util from '../util'

// TODO: this package needs to be replaced as we can't import it in vitest
const is = require('check-more-types')

const debug = Debug('cypress:cli')

const defaultBaseUrl = 'https://download.cypress.io/'
const defaultMaxRedirects = 10

const getProxyForUrlWithNpmConfig = (url: string): string | null => {
  return getProxyForUrl(url) ||
    process.env.npm_config_https_proxy ||
    process.env.npm_config_proxy ||
    null
}

const getBaseUrl = (): string => {
  if (util.getEnv('CYPRESS_DOWNLOAD_MIRROR')) {
    let baseUrl = util.getEnv('CYPRESS_DOWNLOAD_MIRROR')

    if (!baseUrl?.endsWith('/')) {
      baseUrl += '/'
    }

    return baseUrl || defaultBaseUrl
  }

  return defaultBaseUrl
}

const getCA = async (): Promise<string | undefined> => {
  if (process.env.npm_config_cafile) {
    try {
      const caFileContent = await fs.readFile(process.env.npm_config_cafile, 'utf8')

      return caFileContent
    } catch (error) {
      debug('error reading ca file', error)

      return
    }
  }

  if (process.env.npm_config_ca) {
    return process.env.npm_config_ca
  }

  return
}

const prepend = (arch: string, urlPath: string, version: string): string => {
  const endpoint = url.resolve(getBaseUrl(), urlPath)
  const platform = os.platform()
  const pathTemplate = util.getEnv('CYPRESS_DOWNLOAD_PATH_TEMPLATE', true)

  if ((platform === 'win32') && (arch === 'arm64')) {
    debug(`detected platform ${platform} architecture ${arch} combination`)
    arch = 'x64'
    debug(`overriding to download ${platform}-${arch} instead`)
  }

  return pathTemplate
    ? (
      pathTemplate
      .replace(/\\?\$\{endpoint\}/g, endpoint)
      .replace(/\\?\$\{platform\}/g, platform)
      .replace(/\\?\$\{arch\}/g, arch)
      .replace(/\\?\$\{version\}/g, version)
    )
    : `${endpoint}?platform=${platform}&arch=${arch}`
}

const getUrl = (arch: string, version?: string): string => {
  if (is.webUrl(version)) {
    debug('version is already an url', version)

    return version as string
  }

  const urlPath = version ? `desktop/${version}` : 'desktop'

  return prepend(arch, urlPath, version || '')
}

const statusMessage = (err: any): string => {
  return (err.statusCode
    ? [err.statusCode, err.statusMessage].join(' - ')
    : err.toString())
}

const prettyDownloadErr = (err: any, url: string): any => {
  const msg = stripIndent`
    URL: ${url}
    ${statusMessage(err)}
  `

  debug(msg)

  return throwFormErrorText(errors.failedDownload)(msg)
}

/**
 * Checks checksum and file size for the given file. Allows both
 * values or just one of them to be checked.
 */
const verifyDownloadedFile = async (filename: string, expectedSize?: number, expectedChecksum?: string): Promise<any> => {
  if (expectedSize && expectedChecksum) {
    debug('verifying checksum and file size')

    return Bluebird.join(
      util.getFileChecksum(filename),
      util.getFileSize(filename),
      (checksum: string, filesize: number) => {
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

    const checksum: string = await util.getFileChecksum(filename)

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
  }

  if (expectedSize) {
    // maybe we don't have a checksum, but at least CDN returns content length
    // which we can check against the file size
    debug('only checking expected file size %d', expectedSize)

    const filesize: number = await util.getFileSize(filename)

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
  }

  debug('downloaded file lacks checksum or size to verify')

  return
}

// downloads from given url
// return an object with
// {filename: ..., downloaded: true}
const downloadFromUrl = ({ url, downloadDestination, progress, ca, version, redirectTTL = defaultMaxRedirects }: any): any => {
  if (redirectTTL <= 0) {
    return Bluebird.reject(new Error(
      stripIndent`
          Failed downloading the Cypress binary.
          There were too many redirects. The default allowance is ${defaultMaxRedirects}.
          Maybe you got stuck in a redirect loop?
        `,
    ))
  }

  return new Bluebird((resolve: any, reject: any) => {
    const proxy = getProxyForUrlWithNpmConfig(url)

    debug('Downloading package', {
      url,
      proxy,
      downloadDestination,
    })

    if (ca) {
      debug('using custom CA details from npm config')
    }

    const reqOptions = {
      uri: url,
      ...(proxy ? { proxy } : {}),
      ...(ca ? { agentOptions: { ca } } : {}),
      method: 'GET',
      followRedirect: false,
    }
    const req = request(reqOptions)

    // closure
    let started: Date | null = null
    let expectedSize: number | undefined
    let expectedChecksum: string | undefined

    requestProgress(req, {
      throttle: progress.throttle,
    })
    .on('response', (response: any) => {
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

      if (/^3/.test(response.statusCode)) {
        const redirectVersion = response.headers['x-version']
        const redirectUrl = response.headers.location

        debug('redirect version:', redirectVersion)
        debug('redirect url:', redirectUrl)
        downloadFromUrl({ url: redirectUrl, progress, ca, downloadDestination, version: redirectVersion, redirectTTL: redirectTTL - 1 })
        .then(resolve).catch(reject)

        // if our status code does not start with 200
      } else if (!/^2/.test(response.statusCode)) {
        debug('response code %d', response.statusCode)

        const err = new Error(
          stripIndent`
          Failed downloading the Cypress binary.
          Response code: ${response.statusCode}
          Response message: ${response.statusMessage}
        `,
        )

        reject(err)
        // status codes here are all 2xx
      } else {
        // We only enable this pipe connection when we know we've got a successful return
        // and handle the completion with verify and resolve
        // there was a possible race condition between end of request and close of writeStream
        // that is made ordered with this Promise.all
        Bluebird.all([new Bluebird((r: any) => {
          return response.pipe(fs.createWriteStream(downloadDestination).on('close', r))
        }), new Bluebird((r: any) => response.on('end', r))])
        .then(() => {
          debug('downloading finished')
          verifyDownloadedFile(downloadDestination, expectedSize,
            expectedChecksum)
          .then(() => debug('verified'))
          .then(() => resolve(version))
          .catch(reject)
        })
      }
    })
    .on('error', (e: any) => {
      if (e.code === 'ECONNRESET') return // sometimes proxies give ECONNRESET but we don't care

      reject(e)
    })
    .on('progress', (state: any) => {
      // total time we've elapsed
      // starting on our first progress notification
      const elapsed = +new Date() - +(started as Date)

      // request-progress sends a value between 0 and 1
      const percentage = util.convertPercentToPercentage(state.percent)

      const eta = util.calculateEta(percentage, elapsed)

      // send up our percent and seconds remaining
      progress.onProgress(percentage, util.secsRemaining(eta))
    })
  })
}

/**
 * Download Cypress.zip from external versionUrl to local file.
 * @param [string] version Could be "3.3.0" or full URL
 * @param [string] downloadDestination Local filename to save as
 */
const start = async (opts: any): Promise<any> => {
  let { version, downloadDestination, progress, redirectTTL } = opts

  if (!downloadDestination) {
    la(is.unemptyString(downloadDestination), 'missing download dir', opts)
  }

  if (!progress) {
    progress = { onProgress: () => {
      return {}
    } }
  }

  const arch = await util.getRealArch()
  const versionUrl = getUrl(arch, version)

  progress.throttle = 100

  debug('needed Cypress version: %s', version)
  debug('source url %s', versionUrl)
  debug(`downloading cypress.zip to "${downloadDestination}"`)

  try {
    // ensure download dir exists
    await fs.ensureDir(path.dirname(downloadDestination))
    const ca: string | undefined = await getCA()

    return downloadFromUrl({ url: versionUrl, downloadDestination, progress, ca, version,
      ...(redirectTTL ? { redirectTTL } : {}) })
  } catch (err: any) {
    return prettyDownloadErr(err, versionUrl)
  }
}

const downloadModule = {
  start,
  getUrl,
  getProxyForUrlWithNpmConfig,
  getCA,
}

export default downloadModule
