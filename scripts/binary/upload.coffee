awspublish = require('gulp-awspublish')
rename = require('gulp-rename')
debug = require('gulp-debug')
fs      = require("fs-extra")
cp      = require("child_process")
path    = require("path")
gulp    = require("gulp")
human   = require("human-interval")
konfig  = require("../../packages/server/lib/konfig")
Promise = require("bluebird")
meta    = require("./meta")
la      = require("lazy-ass")
check   = require("check-more-types")
uploadUtils = require("./util/upload")

fs = Promise.promisifyAll(fs)

## TODO: refactor this
# system expects desktop application to be inside a file
# with this name
zipName = "cypress.zip"

module.exports = {
  zipName

  getPublisher: ->
    uploadUtils.getPublisher(@getAwsObj)

  getAwsObj: ->
    uploadUtils.getS3Credentials()

  # store uploaded application in subfolders by platform and version
  # something like desktop/0.20.1/osx64/
  getUploadDirName: ({version, platform}) ->
    aws = @getAwsObj()
    osName = uploadUtils.getUploadNameByOs(platform)
    dirName = [aws.folder, version, osName, null].join("/")
    console.log("target directory %s", dirName)
    dirName

  createRemoteManifest: (folder, version) ->
    getUrl = (uploadOsName) ->
      {
        url: [konfig('cdn_url'), folder, version, uploadOsName, zipName].join("/")
      }

    obj = {
      name: "Cypress"
      version: version
      packages: {
        ## keep these for compatibility purposes
        ## although they are now deprecated
        mac: getUrl("osx64")
        win: getUrl("win64")
        linux64: getUrl("linux64")

        ## start adding the new ones
        ## using node's platform
        darwin: getUrl("osx64")
        win32: getUrl("win64")
        linux: getUrl("linux64")
      }
    }

    src = path.resolve("manifest.json")
    fs.outputJsonAsync(src, obj).return(src)

  s3Manifest: (version) ->
    publisher = @getPublisher()

    aws = @getAwsObj()

    headers = {}
    headers["Cache-Control"] = "no-cache"

    manifest = null

    new Promise (resolve, reject) =>
      @createRemoteManifest(aws.folder, version)
      .then (src) ->
        manifest = src

        gulp.src(src)
        .pipe rename (p) ->
          p.dirname = aws.folder + "/" + p.dirname
          p
        .pipe debug()
        .pipe publisher.publish(headers)
        .pipe awspublish.reporter()
        .on "error", reject
        .on "end", resolve
    .finally ->
      fs.removeAsync(manifest)

  toS3: ({zipFile, version, platform}) ->
    console.log("#uploadToS3 ⏳")
    la(check.unemptyString(version), "expected version string", version)
    la(check.unemptyString(zipFile), "expected zip filename", zipFile)
    la(check.extension("zip", zipFile),
      "zip filename should end with .zip", zipFile)
    la(meta.isValidPlatform(platform), "invalid platform", platform)

    console.log("zip filename #{zipFile}")
    if !fs.existsSync(zipFile)
      throw new Error("Cannot find zip file #{zipFile}")

    upload = =>
      new Promise (resolve, reject) =>
        publisher = @getPublisher()

        headers = {}
        headers["Cache-Control"] = "no-cache"

        gulp.src(zipFile)
        .pipe rename (p) =>
          # rename to standard filename zipName
          p.basename = path.basename(zipName, p.extname)
          p.dirname = @getUploadDirName({version, platform})
          p
        .pipe debug()
        .pipe publisher.publish(headers)
        .pipe awspublish.reporter()
        .on "error", reject
        .on "end", resolve

    upload()
    .then ->
      uploadUtils.purgeDesktopAppFromCache({version, platform, zipName})
}
