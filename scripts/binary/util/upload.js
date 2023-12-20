const awspublish = require('gulp-awspublish')
const human = require('human-interval')
const la = require('lazy-ass')
const check = require('check-more-types')
const fse = require('fs-extra')
const Promise = require('bluebird')
const { fromSSO, fromEnv } = require('@aws-sdk/credential-providers')
const _ = require('lodash')

const {
  S3Configuration,
  getFullUploadPath,
  getReleaseUrl,
  isValidPlatformArch,
  getValidPlatformArchs,
  validPlatformArchs,
} = require('./upload-path')

const { purgeCloudflareCache } = require('./purge-cloudflare-cache')

const getS3Credentials = async function () {
  // sso is not required for CirceCI
  if (process.env.CIRCLECI) {
    return fromEnv()()
  }

  // use 'prod' by default to align with our internal docs for setting up `awscli`
  // https://cypress-io.atlassian.net/wiki/spaces/INFRA/pages/1534853121/AWS+SSO+Cypress
  return fromSSO({ profile: process.env.AWS_PROFILE || 'prod' })()
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

// purges desktop application url from Cloudflare cache
const purgeDesktopAppFromCache = function ({ version, platformArch, zipName }) {
  la(check.unemptyString(version), 'missing desktop version', version)
  la(check.unemptyString(platformArch), 'missing platformArch', platformArch)
  la(check.unemptyString(zipName), 'missing zip filename')
  la(check.extension('zip', zipName),
    'zip filename should end with .zip', zipName)

  const url = getReleaseUrl(version, platformArch, zipName)

  return purgeCloudflareCache(url)
}

// purges links to desktop app for all platforms
// for a given version
const purgeDesktopAppAllPlatforms = function (version, zipName) {
  la(check.unemptyString(version), 'missing desktop version', version)
  la(check.unemptyString(zipName), 'missing zipName', zipName)

  console.log(`purging all desktop links for version ${version} from Cloudflare`)

  return Promise.mapSeries(validPlatformArchs, (platformArch) => {
    return purgeDesktopAppFromCache({ version, platformArch, zipName })
  })
}

// reads all lines in from a file as URLs and purges them from Cloudflare
// see Slack conversation https://cypressio.slack.com/archives/C055U0SMV32/p1695851503262999?thread_ts=1695846392.723289&cid=C055U0SMV32
const purgeUrlsFromCloudflareCache = async function (urlsFilePath) {
  const urls = (await fse.readFile(urlsFilePath)).toString().split('\n')

  return Promise.map(_.compact(urls), purgeCloudflareCache, { concurrency: 5 })
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
  getFullUploadPath,
  getReleaseUrl,
  purgeDesktopAppFromCache,
  purgeDesktopAppAllPlatforms,
  isValidPlatformArch,
  getValidPlatformArchs,
  validPlatformArchs,
  saveUrl,
  purgeUrlsFromCloudflareCache,
}
