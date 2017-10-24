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

konfig  = require("../../packages/server/lib/konfig")
uploadUtils = require("./util/upload")

binaryExtension = ".zip"
uploadFileName = "cypress.zip"

isBinaryFile = check.extension(binaryExtension)

# wonder if our CDN url would just work
# https://cdn.cypress.io/desktop/0.20.1/osx64/cypress.zip
# in our case something like this
# https://cdn.cypress.io/desktop/binary/0.20.2/<platform>/<some unique version info>/cypress.tgz
rootFolder = "beta"
folder = "binary"

getCDN = ({version, hash, filename, platform}) ->
  [konfig("cdn_url"), rootFolder, folder, version, platform, hash, filename].join("/")

getUploadDirName = (options) ->
  la(check.unemptyString(options.version), 'missing version', options)
  la(check.unemptyString(options.hash), 'missing hash', options)
  la(check.unemptyString(options.platform), 'missing platform', options)

  dir = [rootFolder, folder, options.version, options.platform, options.hash, null].join("/")
  dir

uploadFile = (options) ->
  new Promise (resolve, reject) ->
    publisher = uploadUtils.getPublisher()

    headers = {}
    # TODO: should cache it!
    headers["Cache-Control"] = "no-cache"

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

  if not options.platform
    options.platform = uploadUtils.getUploadNameByOs()

  uploadFile(options)
  .then () ->
    cdnUrl = getCDN({
      version: options.version,
      hash: options.hash,
      filename: uploadFileName
      platform: options.platform
    })
    console.log("Binary can be downloaded using URL")
    console.log(cdnUrl)
    cdnUrl
  .then uploadUtils.saveUrl("binary-url.json")

module.exports = {
  uploadUniqueBinary,
  getCDN
}

if not module.parent
  uploadUniqueBinary(process.argv)
