const _ = require('lodash')
const path = require('path')
const awspublish = require('gulp-awspublish')
const human = require('human-interval')
const la = require('lazy-ass')
const check = require('check-more-types')
const fse = require('fs-extra')
const os = require('os')
const Promise = require('bluebird')
const { configFromEnvOrJsonFile, filenameToShellVariable } = require('@cypress/env-or-json-file')
const konfig = require('../get-config')()
const { purgeCloudflareCache } = require('./purge-cloudflare-cache')

const getUploadUrl = function () {
  const url = konfig('cdn_url')

  la(check.url(url), 'could not get CDN url', url)
  console.log('upload url', url)

  return url
}

const formHashFromEnvironment = function () {
  const {
    env,
  } = process

  if (env.CIRCLECI) {
    return `circle-${env.CIRCLE_BRANCH}-${env.CIRCLE_SHA1}`
  }

  if (env.APPVEYOR) {
    return `appveyor-${env.APPVEYOR_REPO_BRANCH}-${env.APPVEYOR_REPO_COMMIT}`
  }

  throw new Error('Do not know how to form unique build hash on this CI')
}

const getS3Credentials = function () {
  const key = path.join('scripts', 'support', 'aws-credentials.json')
  const config = configFromEnvOrJsonFile(key)

  if (!config) {
    console.error('⛔️  Cannot find AWS credentials')
    console.error('Using @cypress/env-or-json-file module')
    console.error('and filename', key)
    console.error('which is environment variable', filenameToShellVariable(key))
    console.error('available environment variable keys')
    console.error(Object.keys(process.env))
    throw new Error('AWS config not found')
  }

  la(check.unemptyString(config.bucket), 'missing AWS config bucket')
  la(check.unemptyString(config.folder), 'missing AWS config folder')
  la(check.unemptyString(config.key), 'missing AWS key')
  la(check.unemptyString(config.secret), 'missing AWS secret key')

  return config
}

const getPublisher = function (getAwsObj = getS3Credentials) {
  const aws = getAwsObj()

  // console.log("aws.bucket", aws.bucket)
  return awspublish.create({
    httpOptions: {
      timeout: human('10 minutes'),
    },
    params: {
      Bucket: aws.bucket,
    },
    accessKeyId: aws.key,
    secretAccessKey: aws.secret,
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

// all architectures we are building test runner for
const validPlatformArchs = ['darwin-x64', 'linux-x64', 'win32-ia32', 'win32-x64']
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
      'ia32': 'win32-ia32',
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
