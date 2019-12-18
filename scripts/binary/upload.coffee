awspublish  = require('gulp-awspublish')
rename      = require('gulp-rename')
gulpDebug   = require('gulp-debug')
fs      = require("fs-extra")
cp      = require("child_process")
path    = require("path")
gulp    = require("gulp")
human   = require("human-interval")
konfig  = require('../binary/get-config')()
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

  # returns desktop folder for a given folder without platform
  # something like desktop/0.20.1
  getUploadeVersionFolder: (aws, version) ->
    la(check.unemptyString(aws.folder), 'aws object is missing desktop folder', aws.folder)
    dirName = [aws.folder, version].join("/")
    dirName

  getFullUploadName: ({folder, version, platformArch, name}) ->
    la(check.unemptyString(folder), 'missing folder', folder)
    la(check.semver(version), 'missing or invalid version', version)
    la(check.unemptyString(name), 'missing file name', name)
    la(uploadUtils.isValidPlatformArch(platformArch),
      'invalid platform and arch', platformArch)

    fileName = [folder, version, platformArch, name].join("/")
    fileName

  # store uploaded application in subfolders by platform and version
  # something like desktop/0.20.1/darwin-x64/
  getUploadDirName: ({version, platform}) ->
    aws = @getAwsObj()
    platformArch = uploadUtils.getUploadNameByOsAndArch(platform)

    versionFolder = @getUploadeVersionFolder(aws, version)
    dirName = [versionFolder, platformArch, null].join("/")

    console.log("target directory %s", dirName)
    dirName

  getManifestUrl: (folder, version, uploadOsName) ->
    {
      url: [konfig('cdn_url'), folder, version, uploadOsName, zipName].join("/")
    }

  getRemoteManifest: (folder, version) ->
    la(check.unemptyString(folder), 'missing manifest folder', folder)
    la(check.semver(version), 'invalid manifest version', version)

    getUrl = @getManifestUrl.bind(null, folder, version)

    {
      name: "Cypress"
      version: version
      packages: {
        ## keep these for compatibility purposes
        ## although they are now deprecated
        mac: getUrl("darwin-x64")
        win: getUrl("win32-ia32")
        linux64: getUrl("linux-x64")

        ## start adding the new ones
        ## using node's platform
        darwin: getUrl("darwin-x64")
        win32: getUrl("win32-ia32")
        linux: getUrl("linux-x64")

        ## the new-new names that use platform and arch as is
        "darwin-x64": getUrl("darwin-x64")
        "linux-x64": getUrl("linux-x64")
        "win32-ia32": getUrl("win32-ia32")
        "win32-x64": getUrl("win32-x64")
      }
    }

  createRemoteManifest: (folder, version) ->
    obj = @getRemoteManifest(folder, version)

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
        .pipe gulpDebug()
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
