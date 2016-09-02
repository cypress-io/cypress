## TODO: move this to packages/core-file-server

url     = require("url")
http    = require("http")
path    = require("path")
send    = require("send")
compact = require("lodash.compact")
errors  = require("./errors")

onRequest = (req, res, fileServerFolder) ->
  args = compact([
    fileServerFolder,
    req.url
  ])

  ## strip off any query params from our req's url
  ## since we're pulling this from the file system
  ## it does not understand query params
  ## and make sure we decode the uri which swaps out
  ## %20 with white space
  file = decodeURI url.parse(path.join(args...)).pathname

  res.setHeader("x-cypress-file-path", file)

  send(req, url.parse(req.url).pathname, {
    root: path.resolve(fileServerFolder)
  })
  .on "error", (err) ->
    res.setHeader("x-cypress-file-server-error", true)
    res.statusCode = err.status
    res.end()
  .pipe(res)

module.exports = {
  create: (fileServerFolder) ->
    new Promise (resolve) ->
      srv = http.createServer (req, res) ->
        onRequest(req, res, fileServerFolder)

      srv.listen ->
        resolve({
          port: ->
            srv.address().port

          address: ->
            "http://localhost:" + @port()

          close: ->
            new Promise (resolve) ->
              srv.close(resolve)
      })
}