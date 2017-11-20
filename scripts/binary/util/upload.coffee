path = require("path")
awspublish = require('gulp-awspublish')
human = require("human-interval")
la = require("lazy-ass")
check = require("check-more-types")
cp = require("child_process")
fs = require("fs")
os = require("os")
Promise = require("bluebird")
{configFromEnvOrJsonFile, filenameToShellVariable} = require('@cypress/env-or-json-file')
konfig  = require("../../../packages/server/lib/konfig")

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

hasCloudflareEnvironmentVars = () ->
  check.unemptyString(process.env.CF_TOKEN) &&
  check.unemptyString(process.env.CF_EMAIL) &&
  check.unemptyString(process.env.CF_DOMAIN)

# depends on the credentials file or environment variables
makeCloudflarePurgeCommand = (url) ->
  configFile = path.resolve(__dirname, "..", "support", ".cfcli.yml")
  if fs.existsSync(configFile)
    console.log("using CF credentials file")
    return "cfcli purgefile -c #{configFile} #{url}"
  else if hasCloudflareEnvironmentVars()
    console.log("using CF environment variables")
    token = process.env.CF_TOKEN
    email = process.env.CF_EMAIL
    domain = process.env.CF_DOMAIN
    return "cfcli purgefile -e #{email} -k #{token} -d #{domain} #{url}"
  else
    throw new Error("Cannot form Cloudflare purge command without credentials")

# purges a given url from Cloudflare
purgeCache = (url) ->
  la(check.url(url), "missing url to purge", url)

  new Promise (resolve, reject) =>
    console.log("purging url", url)
    purgeCommand = makeCloudflarePurgeCommand(url)
    cp.exec purgeCommand, (err, stdout, stderr) ->
      if err
        console.error("Could not purge #{url}")
        console.error(err.message)
        return reject(err)
      console.log("#purgeCache: #{url}")
      resolve()

getDestktopUrl = (version, osName, zipName) ->
  url = [konfig("cdn_url"), "desktop", version, osName, zipName].join("/")
  url

# purges desktop application url from Cloudflare cache
purgeDesktopAppFromCache = ({version, platform, zipName}) ->
  la(check.unemptyString(version), "missing desktop version", version)
  la(check.unemptyString(platform), "missing platform", platform)
  la(check.unemptyString(zipName), "missing zip filename")
  la(check.extension("zip", zipName),
    "zip filename should end with .zip", zipName)

  osName = getUploadNameByOs(platform)
  la(check.unemptyString(osName), "missing osName", osName)
  url = getDestktopUrl(version, osName, zipName)
  purgeCache(url)

# purges links to desktop app for all platforms
# for a given version
purgeDesktopAppAllPlatforms = (version, zipName) ->
  la(check.unemptyString(version), "missing desktop version", version)
  la(check.unemptyString(zipName), "missing zipName", zipName)

  platforms = ["darwin", "linux", "win32"]
  console.log("purging all desktop links for version #{version} from Cloudflare")
  Promise.mapSeries platforms, (platform) ->
    purgeDesktopAppFromCache({version, platform, zipName})

getUploadNameByOs = (osName = os.platform()) ->
  uploadNames = {
    darwin: "osx64"
    linux:  "linux64"
    win32:  "win64"
  }
  name = uploadNames[osName]
  if not name
    throw new Error("Cannot find upload name for OS #{osName}")
  name

saveUrl = (filename) -> (url) ->
  la(check.unemptyString(filename), "missing filename", filename)
  la(check.url(url), "invalid url to save", url)
  s = JSON.stringify({url})
  fs.writeFileSync(filename, s)
  console.log("saved url", url)
  console.log("into file", filename)

module.exports = {
  getS3Credentials,
  getPublisher,
  purgeCache,
  purgeDesktopAppFromCache,
  purgeDesktopAppAllPlatforms,
  getUploadNameByOs,
  saveUrl,
  formHashFromEnvironment
}
