$       = require("gulp-load-plugins")()
fs      = require("fs-extra")
gulp    = require("gulp")
Promise = require("bluebird")

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

  getUploadDirName: (version, uploadName) ->
    aws = @getAwsObj()

    [aws.folder, version, uploadName, null].join("/")

  toS3: (platform, pathToZipFile) ->
    platform.log("#uploadToS3")

    version = platform.getVersion()
    name    = platform.uploadName

    new Promise (resolve, reject) =>

      publisher = @getPublisher()

      headers = {}
      headers["Cache-Control"] = "no-cache"

      gulp.src(pathToZipFile)
      .pipe $.rename (p) =>
        p.dirname = @getUploadDirName(version, name)
        p
      .pipe $.debug()
      .pipe publisher.publish(headers)
      .pipe $.awspublish.reporter()
      .on "error", reject
      .on "end", resolve

}