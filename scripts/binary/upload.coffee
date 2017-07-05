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

fs = Promise.promisifyAll(fs)

uploadNames = {
  darwin: "osx64"
  linux:  "linux64"
  win32:  "win64"
}

getUploadNameByOs = (os) ->
  name = uploadNames[os]
  if not name
    throw new Error("Cannot find upload name for OS #{os}")
  name

module.exports = {
  getPublisher: ->
    aws = @getAwsObj()

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

  getAwsObj: ->
    fs.readJsonSync(path.join(__dirname, "support", "aws-credentials.json"))

  # store uploaded application in subfolders by platform and version
  # something like desktop/0.20.1/osx64/
  getUploadDirName: ({version, platform}) ->
    aws = @getAwsObj()
    osName = getUploadNameByOs(platform)
    dirName = [aws.folder, version, osName, null].join("/")
    console.log("target directory %s", dirName)
    dirName

  purgeCache: ({zipFile, version, platform}) ->
    la(check.unemptyString(platform), "missing platform", platform)
    new Promise (resolve, reject) =>
      zipName = path.basename(zipFile)

      url = [konfig('cdn_url'), "desktop", version, platform, zipName].join("/")
      console.log("purging url", url)
      configFile = path.resolve(__dirname, "support", ".cfcli.yml")
      cp.exec "cfcli purgefile -c #{configFile} #{url}", (err, stdout, stderr) ->
        if err
          console.error("Could not purge #{url}")
          console.error(err.message)
          return reject(err)
        console.log("#purgeCache: #{url}")
        resolve()

  createRemoteManifest: (folder, version) ->
    ## TODO: refactor this
    zipName = "cypress.zip"

    getUrl = (uploadOsName) ->
      {
        url: [konfig('cdn_url'), folder, version, uploadOsName, zipName].join("/")
      }

    obj = {
      name: "Cypress"
      version: version
      packages: {
        mac: getUrl("osx64")
        win: getUrl("win64")
        linux64: getUrl("linux64")
      }
    }

    src = path.join(meta.buildDir, "manifest.json")
    fs.outputJsonAsync(src, obj).return(src)

  s3Manifest: (version) ->
    publisher = @getPublisher()

    aws = @getAwsObj()

    headers = {}
    headers["Cache-Control"] = "no-cache"

    new Promise (resolve, reject) =>
      @createRemoteManifest(aws.folder, version).then (src) ->
        gulp.src(src)
        .pipe rename (p) ->
          p.dirname = aws.folder + "/" + p.dirname
          p
        .pipe debug()
        .pipe publisher.publish(headers)
        .pipe awspublish.reporter()
        .on "error", reject
        .on "end", resolve

  toS3: ({zipFile, version, platform}) ->
    console.log("#uploadToS3 ⏳")
    la(check.unemptyString(version), "expected version string", version)
    la(check.unemptyString(zipFile), "expected zip filename", zipFile)
    la(meta.isValidPlatform(platform), "invalid platform", platform)

    upload = =>
      new Promise (resolve, reject) =>
        publisher = @getPublisher()

        headers = {}
        headers["Cache-Control"] = "no-cache"

        gulp.src(zipFile)
        .pipe rename (p) =>
          p.dirname = @getUploadDirName({version, platform})
          p
        .pipe debug()
        .pipe publisher.publish(headers)
        .pipe awspublish.reporter()
        .on "error", reject
        .on "end", resolve

    upload()
    .then =>
      @purgeCache({zipFile, version, platform})
}
