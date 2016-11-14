fs      = require("fs-extra")
r       = require("request")
rp      = require("request-promise")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

module.exports = {
  video: (video, videoUrl) ->
    url = "https://s3.amazonaws.com/builds-test.cypress.io/d94705a8-0267-4a38-8f43-8bf43760c591?AWSAccessKeyId=AKIAJLHJQVS6USWJ2PTA&Expires=1479336198&Signature=TO7UOgX9mwtOXW15rp852A10GUU%3D"

    fs
    .readFileAsync(video)
    .then (buf) ->
      rp({
        url: url
        method: "PUT"
        body: buf
      })
    .then(console.log)

    # r.debug = true

    # resp = (err, resp, body) ->
    #   console.log err, resp, body

    # fs
    # .createReadStream(video)
    # .pipe(r.put({
    #   url: url
    #   # encoding: null
    # }, resp))
    # .on "error", (err) ->
    #   console.log err
    # .on "response", (resp) ->
      # console.log resp


    # rp.debug = true

    # rp({
    #   url: url
    #   method: "PUT"
    #   # body: fs.readFileSync(video, {encoding: "base64"})
    #   # body: fs.createReadStream(video, {encoding: "binary"})
    #   # body: fs.createReadStream(video)
    #   # formData: {
    #   #   file:  fs.createReadStream(video)
    #   # }
    # })
    # .then(console.log)
    # .then ->
    #   console.log "DONE"
    #   process.exit()

  screenshot: (screenshots, screenshotsUrl) ->

  process: (videoUrl, screenshotsUrl) ->
    uploads = []

    if videoUrl
      uploads.push(videoUrl)

    if screenshotsUrl
      uploads = uploads.concat(screenshotsUrl)

    Promise
    .map(uploads, upload)
}