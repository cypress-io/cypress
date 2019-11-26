_ = require("lodash")
path = require("path")
awspublish = require('gulp-awspublish')
human = require("human-interval")
la = require("lazy-ass")
check = require("check-more-types")
cp = require("child_process")
fse = require("fs-extra")
os = require("os")
Promise = require("bluebird")
{configFromEnvOrJsonFile, filenameToShellVariable} = require('@cypress/env-or-json-file')
konfig = require('../../binary/get-config')()
{ purgeCloudflareCache } = require('./purge-cloudflare-cache')

formHashFromEnvironment = () ->
  env = process.env
  if env.BUILDKITE
    return "buildkite-#{env.BUILDKITE_BRANCH}-#{env.BUILDKITE_COMMIT}-#{env.BUILDKITE_BUILD_NUMBER}"
  if env.CIRCLECI
    return "circle-#{env.CIRCLE_BRANCH}-#{env.CIRCLE_SHA1}-#{env.CIRCLE_BUILD_NUM}"
  if env.APPVEYOR
    return "appveyor-#{env.APPVEYOR_REPO_BRANCH}-#{env.APPVEYOR_REPO_COMMIT}-#{env.APPVEYOR_BUILD_ID}"

  throw new Error("Do not know how to form unique build hash on this CI")

getS3Credentials = () ->
  key = path.join('scripts', 'support', 'aws-credentials.json')
  config = configFromEnvOrJsonFile(key)

  if !config
    console.error('⛔️  Cannot find AWS credentials')
    console.error('Using @cypress/env-or-json-file module')
    console.error('and filename', key)
    console.error('which is environment variable', filenameToShellVariable(key))
    console.error('available environment variable keys')
    console.error(Object.keys(process.env))
    throw new Error('AWS config not found')

  la(check.unemptyString(config.bucket), 'missing AWS config bucket')
  la(check.unemptyString(config.folder), 'missing AWS config folder')
  la(check.unemptyString(config.key), 'missing AWS key')
  la(check.unemptyString(config.secret), 'missing AWS secret key')

  config

getPublisher = (getAwsObj = getS3Credentials) ->
  aws = getAwsObj()

  # console.log("aws.bucket", aws.bucket)
  awspublish.create {
    httpOptions: {
      timeout: human("10 minutes")
    }
    params: {
      Bucket:        aws.bucket
    }
    accessKeyId:     aws.key
    secretAccessKey: aws.secret
  }

getDesktopUrl = (version, osName, zipName) ->
  [konfig("cdn_url"), "desktop", version, osName, zipName].join("/")

# purges desktop application url from Cloudflare cache
purgeDesktopAppFromCache = ({version, platform, zipName}) ->
  la(check.unemptyString(version), "missing desktop version", version)
  la(check.unemptyString(platform), "missing platform", platform)
  la(check.unemptyString(zipName), "missing zip filename")
  la(check.extension("zip", zipName),
    "zip filename should end with .zip", zipName)

  osName = getUploadNameByOsAndArch(platform)
  la(check.unemptyString(osName), "missing osName", osName)
  url = getDesktopUrl(version, osName, zipName)

  purgeCloudflareCache(url)

# purges links to desktop app for all platforms
# for a given version
purgeDesktopAppAllPlatforms = (version, zipName) ->
  la(check.unemptyString(version), "missing desktop version", version)
  la(check.unemptyString(zipName), "missing zipName", zipName)

  platforms = ["darwin", "linux", "win32"]
  console.log("purging all desktop links for version #{version} from Cloudflare")
  Promise.mapSeries platforms, (platform) ->
    purgeDesktopAppFromCache({version, platform, zipName})

# all architectures we are building test runner for
validPlatformArchs = ["darwin-x64", "linux-x64", "win32-ia32", "win32-x64"]
# simple check for platform-arch string
# example: isValidPlatformArch("darwin") // FALSE
isValidPlatformArch = check.oneOf(validPlatformArchs)

getValidPlatformArchs = () -> validPlatformArchs

getUploadNameByOsAndArch = (platform) ->
  ## just hard code for now...
  arch = os.arch()

  uploadNames = {
    darwin: {
      "x64": "darwin-x64"
    },
    linux: {
      "x64": "linux-x64"
    },
    win32: {
      "x64": "win32-x64",
      "ia32": "win32-ia32"
    }
  }
  name = _.get(uploadNames[platform], arch)
  if not name
    throw new Error("Cannot find upload name for OS: '#{platform}' with arch: '#{arch}'")
  la(isValidPlatformArch(name), "formed invalid platform", name, "from", platform, arch)

  name

saveUrl = (filename) -> (url) ->
  la(check.unemptyString(filename), "missing filename", filename)
  la(check.url(url), "invalid url to save", url)
  s = JSON.stringify({url})
  fse.writeFile(filename, s)
  .then =>
    console.log("saved url", url, "into file", filename)

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
  formHashFromEnvironment
}
