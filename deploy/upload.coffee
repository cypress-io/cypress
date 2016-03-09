$       = require("gulp-load-plugins")()
fs      = require("fs-extra")
cp      = require("child_process")
gulp    = require("gulp")
Promise = require("bluebird")
config  = require("../lib/config")

fs = Promise.promisifyAll(fs)

module.exports = {
  getPublisher: ->
    aws = @getAwsObj()

    $.awspublish.create
      params: {
        Bucket:        aws.bucket
      }
      accessKeyId:     aws.key
      secretAccessKey: aws.secret

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

      url = [config.app.cdn_url, "desktop", version, uploadOsName, zipName].join("/")

      cp.exec "cfcli purgefile #{url}", (err, stdout, stderr) ->
        return reject(err) if err

        platform.log("#purgeCache: #{url}")

        resolve()

  toS3: (platform) ->
    platform.log("#uploadToS3")

    upload = =>
      new Promise (resolve, reject) =>

        pathToZipFile = platform.buildPathToZip()

        publisher = @getPublisher()

        headers = {}
        headers["Cache-Control"] = "no-cache"

        gulp.src(pathToZipFile)
        .pipe $.rename (p) =>
          p.dirname = @getUploadDirName(platform)
          p
        .pipe $.debug()
        .pipe publisher.publish(headers)
        .pipe $.awspublish.reporter()
        .on "error", reject
        .on "end", resolve

    upload()
    .then =>
      @purgeCache(platform)
}