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
la      = require("lazy-ass")
check   = require("check-more-types")

fs = Promise.promisifyAll(fs)

isValidPlatform = check.oneOf(["darwin", "linux"])

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

  getUploadDirName: ({version, osName}) ->
    aws = @getAwsObj()
    dirName = [aws.folder, version, osName, null].join("/")
    console.log("target directory %s", dirName)
    dirName

  purgeCache: ({zipFile, version, osName}) ->
    new Promise (resolve, reject) =>
      zipName      = path.basename(zipFile)

      url = [konfig('cdn_url'), "desktop", version, osName, zipName].join("/")
      console.log("purging url", url)
      resolve()
      # cp.exec "cfcli purgefile #{url}", (err, stdout, stderr) ->
      #   return reject(err) if err
      #   platform.log("#purgeCache: #{url}")
      #   resolve()

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

  toS3: ({zipFile, version, osName}) ->
    console.log("#uploadToS3 ⏳")
    la(check.unemptyString(version), "expected version string", version)
    la(check.unemptyString(zipFile), "expected zip filename", zipFile)
    la(isValidPlatform(osName), "invalid osName", osName)

    upload = =>
      new Promise (resolve, reject) =>
        publisher = @getPublisher()

        headers = {}
        headers["Cache-Control"] = "no-cache"

        gulp.src(zipFile)
        .pipe rename (p) =>
          p.dirname = @getUploadDirName({version, osName})
          p
        .pipe debug()
        # .pipe publisher.publish(headers)
        # .pipe awspublish.reporter()
        .on "error", reject
        .on "end", resolve

    upload()
    .then =>
      @purgeCache({zipFile, version, osName})
}
