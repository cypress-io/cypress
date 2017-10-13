fs      = require("fs-extra")
r       = require("request")
rp      = require("request-promise")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

module.exports = {
  send: (pathToFile, url) ->
    fs
    .readFileAsync(pathToFile)
    .then (buf) ->
      rp({
        url: url
        method: "PUT"
        body: buf
      })
}
