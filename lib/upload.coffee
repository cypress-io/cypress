fs      = require("fs-extra")
r       = require("request")
rp      = require("request-promise")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

module.exports = {
  video: (video, videoUrl) ->
    fs
    .readFileAsync(video)
    .then (buf) ->
      rp({
        url: videoUrl
        method: "PUT"
        body: buf
      })

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