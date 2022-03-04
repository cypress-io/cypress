const _ = require('lodash')
const awspublish = require('gulp-awspublish')
const human = require('human-interval')
const la = require('lazy-ass')
const check = require('check-more-types')
const fse = require('fs-extra')
const os = require('os')
const Promise = require('bluebird')
const { fromSSO, fromEnv } = require('@aws-sdk/credential-providers')

const konfig = require('../get-config')()
const { purgeCloudflareCache } = require('./purge-cloudflare-cache')

const getUploadUrl = function () {
  const url = konfig('cdn_url')

  la(check.url(url), 'could not get CDN url', url)

  return url
}

const formHashFromEnvironment = function () {
  const {
    env,
  } = process

  if (env.CIRCLECI) {
    return `${env.CIRCLE_BRANCH}-${env.CIRCLE_SHA1}`
  }

  throw new Error('Do not know how to form unique build hash on this CI')
}

const S3Configuration = {
  bucket: 'cdn.cypress.io',
  releaseFolder: 'desktop',
  binaryZipName: 'cypress.zip',
  betaUploadTypes: {
    binary: {
      uploadFolder: 'binary',
      uploadFileName: 'cypress.zip',
    },
    'npm-package': {
      uploadFolder: 'npm',
      uploadFileName: 'cypress.tgz',
    },
  },
}

const getS3Credentials = async function () {
  // sso is not required for CirceCI
  if (process.env.CIRCLECI) {
    return fromEnv()()
  }

  return fromSSO({ profile: process.env.AWS_PROFILE || 'production' })()
}

const getPublisher = async function () {
  const aws = await getS3Credentials()

  return awspublish.create({
    httpOptions: {
      timeout: human('10 minutes'),
    },
    params: {
      Bucket: S3Configuration.bucket,
    },
    accessKeyId: aws.accessKeyId,
    secretAccessKey: aws.secretAccessKey,
    sessionToken: aws.sessionToken,
  })
}

const getDesktopUrl = function (version, osName, zipName) {
  const url = getUploadUrl()

  return [url, 'desktop', version, osName, zipName].join('/')
}

// purges desktop application url from Cloudflare cache
const purgeDesktopAppFromCache = function ({ version, platform, zipName }) {
  la(check.unemptyString(version), 'missing desktop version', version)
  la(check.unemptyString(platform), 'missing platform', platform)
  la(check.unemptyString(zipName), 'missing zip filename')
  la(check.extension('zip', zipName),
    'zip filename should end with .zip', zipName)

  const osName = getUploadNameByOsAndArch(platform)

  la(check.unemptyString(osName), 'missing osName', osName)
  const url = getDesktopUrl(version, osName, zipName)

  return purgeCloudflareCache(url)
}

// purges links to desktop app for all platforms
// for a given version
const purgeDesktopAppAllPlatforms = function (version, zipName) {
  la(check.unemptyString(version), 'missing desktop version', version)
  la(check.unemptyString(zipName), 'missing zipName', zipName)

  const platforms = ['darwin', 'linux', 'win32']

  console.log(`purging all desktop links for version ${version} from Cloudflare`)

  return Promise.mapSeries(platforms, (platform) => {
    return purgeDesktopAppFromCache({ version, platform, zipName })
  })
}

// all architectures we are building the test runner for
const validPlatformArchs = ['darwin-x64', 'linux-x64', 'win32-x64']
// simple check for platform-arch string
// example: isValidPlatformArch("darwin") // FALSE
const isValidPlatformArch = check.oneOf(validPlatformArchs)

const getValidPlatformArchs = () => {
  return validPlatformArchs
}

const getUploadNameByOsAndArch = function (platform) {
  // just hard code for now...
  const arch = os.arch()

  const uploadNames = {
    darwin: {
      'x64': 'darwin-x64',
    },
    linux: {
      'x64': 'linux-x64',
    },
    win32: {
      'x64': 'win32-x64',
    },
  }
  const name = _.get(uploadNames[platform], arch)

  if (!name) {
    throw new Error(`Cannot find upload name for OS: '${platform}' with arch: '${arch}'`)
  }

  la(isValidPlatformArch(name), 'formed invalid platform', name, 'from', platform, arch)

  return name
}

const saveUrl = (filename) => {
  return (function (url) {
    la(check.unemptyString(filename), 'missing filename', filename)
    la(check.url(url), 'invalid url to save', url)
    const s = JSON.stringify({ url })

    return fse.writeFile(filename, s)
    .then(() => {
      return console.log('saved url', url, 'into file', filename)
    })
  })
}

module.exports = {
  S3Configuration,
  getS3Credentials,
  getPublisher,
  purgeDesktopAppFromCache,
  purgeDesktopAppAllPlatforms,
  getUploadNameByOsAndArch,
  validPlatformArchs,
  getValidPlatformArchs,
  isValidPlatformArch,
  saveUrl,
  formHashFromEnvironment,
  getUploadUrl,
}
