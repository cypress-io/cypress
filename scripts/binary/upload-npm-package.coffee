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

konfig = require('../binary/get-config')()
uploadUtils = require("./util/upload")

npmPackageExtension = ".tgz"
uploadFileName = "cypress.tgz"

isNpmPackageFile = check.extension(npmPackageExtension)

# the package tgz file will be uploaded into unique folder
# in our case something like this
# https://cdn.cypress.io/beta/npm/<version>/<some unique hash>/cypress.tgz
rootFolder = "beta"
npmFolder = "npm"

getCDN = ({version, hash, filename}) ->
  la(check.semver(version), 'invalid version', version)
  la(check.unemptyString(hash), 'missing hash', hash)
  la(check.unemptyString(filename), 'missing filename', filename)
  la(isNpmPackageFile(filename), 'wrong extension for file', filename)
  [konfig("cdn_url"), rootFolder, npmFolder, version, hash, filename].join("/")

getUploadDirName = (options) ->
  la(check.unemptyString(options.version), 'missing version', options)
  la(check.unemptyString(options.hash), 'missing hash', options)
  dir = [rootFolder, npmFolder, options.version, options.hash, null].join("/")
  dir

uploadFile = (options) ->
  new Promise (resolve, reject) ->
    publisher = uploadUtils.getPublisher()

    headers = {}
    headers["Cache-Control"] = "no-cache"

    gulp.src(options.file)
    .pipe rename (p) =>
      p.basename = path.basename(uploadFileName, npmPackageExtension)
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

uploadNpmPackage = (args = []) ->
  console.log(args)
  options = minimist(args, {
    string: ["version", "file", "hash"],
    alias: {
      version: "v",
      file: "f",
      hash: "h"
    }
  })
  console.log("Upload NPM package options")
  console.log(options)

  la(check.unemptyString(options.file), "missing file to upload", options)
  la(isNpmPackageFile(options.file),
    "invalid file to upload extension", options.file)

  if not options.hash
    options.hash = uploadUtils.formHashFromEnvironment()

  la(check.unemptyString(options.hash), "missing hash to give", options)
  la(check.unemptyString(options.version), "missing version", options)

  la(fs.existsSync(options.file), "cannot find file", options.file)

  uploadFile(options)
  .then () ->
    cdnUrl = getCDN({
      version: options.version,
      hash: options.hash,
      filename: uploadFileName
    })
    console.log("NPM package can be installed using URL")
    console.log("npm install %s", cdnUrl)
    cdnUrl
  .then uploadUtils.saveUrl("npm-package-url.json")

  # for now disable purging from CDN cache
  # because each upload should be unique by hash
  # .then R.tap(uploadUtils.purgeCache)

module.exports = {
  uploadNpmPackage,
  getCDN
}

if not module.parent
  uploadNpmPackage(process.argv)
