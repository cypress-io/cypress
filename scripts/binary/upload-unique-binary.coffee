minimist = require("minimist")
Promise = require("bluebird")
la = require("lazy-ass")
check = require("check-more-types")
fs = require("fs")
path = require("path")
awspublish = require('gulp-awspublish')
rename = require('gulp-rename')
debug = require('gulp-debug')
gulp = require("gulp")
human = require("human-interval")
R = require("ramda")
hasha = require('hasha')

konfig = require('../binary/get-config')()
uploadUtils = require("./util/upload")
s3helpers = require("./s3-api").s3helpers

# we zip the binary on every platform and upload under same name
binaryExtension = ".zip"
uploadFileName = "cypress.zip"

isBinaryFile = check.extension(binaryExtension)

rootFolder = "beta"
folder = "binary"

# the binary will be uploaded into unique folder
# in our case something like this
# https://cdn.cypress.io/desktop/binary/0.20.2/<platform>/<some unique version info>/cypress.zip
getCDN = ({version, hash, filename, platform}) ->
  la(check.semver(version), 'invalid version', version)
  la(check.unemptyString(hash), 'missing hash', hash)
  la(check.unemptyString(filename), 'missing filename', filename)
  la(isBinaryFile(filename), 'wrong extension for file', filename)
  la(check.unemptyString(platform), 'missing platform', platform)

  cdnUrl = konfig("cdn_url")
  [cdnUrl, rootFolder, folder, version, platform, hash, filename].join("/")

# returns folder that contains beta (unreleased) binaries for given version
#
getUploadVersionDirName = (options) ->
  la(check.unemptyString(options.version), 'missing version', options)

  dir = [rootFolder, folder, options.version].join("/")
  dir

getUploadDirForPlatform = (options, platformArch) ->
  la(uploadUtils.isValidPlatformArch(platformArch),
    'missing or invalid platformArch', platformArch)

  versionDir = getUploadVersionDirName(options)
  la(check.unemptyString(versionDir), 'could not form folder from', options)

  dir = [versionDir, platformArch].join("/")
  dir

getUploadDirName = (options) ->
  la(check.unemptyString(options.hash), 'missing hash', options)

  uploadFolder = getUploadDirForPlatform(options, options.platformArch)
  la(check.unemptyString(uploadFolder), 'could not form folder from', options)

  dir = [uploadFolder, options.hash, null].join("/")
  dir

uploadFile = (options) ->
  new Promise (resolve, reject) ->
    publisher = uploadUtils.getPublisher()

    headers = {}
    headers["Cache-Control"] = "no-cache"

    # add custom metadata with checksums
    # every value should be a string
    checksum = hasha.fromFileSync(options.file)
    size = fs.statSync(options.file).size
    console.log('SHA256 checksum %s', checksum)
    console.log('size', size)
    headers["x-amz-meta-checksum"] = checksum
    headers["x-amz-meta-size"] = String(size)

    gulp.src(options.file)
    .pipe rename (p) =>
      p.basename = path.basename(uploadFileName, binaryExtension)
      p.dirname = getUploadDirName(options)
      console.log("renaming upload to", p.dirname, p.basename)
      la(check.unemptyString(p.basename), "missing basename")
      la(check.unemptyString(p.dirname), "missing dirname")
      p
    .pipe debug()
    .pipe publisher.publish(headers)
    .pipe awspublish.reporter()
    .on "error", reject
    .on "end", resolve

uploadUniqueBinary = (args = []) ->
  options = minimist(args, {
    string: ["version", "file", "hash", "platform"],
    alias: {
      version: "v",
      file: "f",
      hash: "h"
    }
  })
  console.log("Upload unique binary options")
  pickOptions = R.pick(["file", "version", "hash"])
  console.log(pickOptions(options))

  la(check.unemptyString(options.file), "missing file to upload", options)
  la(isBinaryFile(options.file),
    "invalid file to upload extension", options.file)

  if not options.hash
    options.hash = uploadUtils.formHashFromEnvironment()

  la(check.unemptyString(options.hash), "missing hash to give", options)
  la(check.unemptyString(options.version), "missing version", options)

  la(fs.existsSync(options.file), "cannot find file", options.file)

  platform = options.platform ? process.platform

  options.platformArch = uploadUtils.getUploadNameByOsAndArch(platform)

  uploadFile(options)
  .then () ->
    cdnUrl = getCDN({
      version: options.version,
      hash: options.hash,
      filename: uploadFileName
      platform: options.platformArch
    })
    console.log("Binary can be downloaded using URL")
    console.log(cdnUrl)
    cdnUrl
  .then uploadUtils.saveUrl("binary-url.json")

module.exports = {
  getUploadDirName,
  getUploadDirForPlatform,
  uploadUniqueBinary,
  getCDN
}

if not module.parent
  uploadUniqueBinary(process.argv)
