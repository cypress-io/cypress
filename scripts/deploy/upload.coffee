awspublish = require('gulp-awspublish')
rename = require('gulp-rename')
debug = require('gulp-debug')
fs      = require("fs-extra")
cp      = require("child_process")
path    = require("path")
gulp    = require("gulp")
human   = require("human-interval")
konfig  = require("@packages/server/lib/konfig")()
Promise = require("bluebird")
meta    = require("./meta")

# TODO please do not hardcode me
# CDN_URL = "https://cdn.cypress.io"

fs = Promise.promisifyAll(fs)

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
    fs.readJsonSync("./support/aws-credentials.json")

  getUploadDirName: (platform) ->
    aws = @getAwsObj()

    [aws.folder, platform.getVersion(), platform.uploadOsName, null].join("/")

  purgeCache: (platform) ->
    new Promise (resolve, reject) =>
      version      = platform.getVersion()
      uploadOsName = platform.uploadOsName
      zipName      = platform.zipName

      url = [konfig('cdn_url'), "desktop", version, uploadOsName, zipName].join("/")

      cp.exec "cfcli purgefile #{url}", (err, stdout, stderr) ->
        return reject(err) if err

        platform.log("#purgeCache: #{url}")

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

  toS3: (platform) ->
    platform.log("#uploadToS3")

    upload = =>
      new Promise (resolve, reject) =>

        pathToZipFile = platform.buildPathToZip()

        publisher = @getPublisher()

        headers = {}
        headers["Cache-Control"] = "no-cache"

        gulp.src(pathToZipFile)
        .pipe rename (p) =>
          p.dirname = @getUploadDirName(platform)
          p
        .pipe debug()
        .pipe publisher.publish(headers)
        .pipe awspublish.reporter()
        .on "error", reject
        .on "end", resolve

    upload()
    .then =>
      @purgeCache(platform)
}
