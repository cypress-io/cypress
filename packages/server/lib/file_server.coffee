## TODO: move this to packages/core-file-server

_            = require("lodash")
debug        = require("debug")("cypress:server:file_server")
url          = require("url")
http         = require("http")
path         = require("path")
send         = require("send")
errors       = require("./errors")
allowDestroy = require("./util/server_destroy")
random       = require("./util/random")
networkFailures = require("./util/network_failures")

onRequest = (req, res, expectedToken, fileServerFolder) ->
  token = req.headers['x-cypress-authorization']

  if token != expectedToken
    debug('authorization failed on file_server request %o', { reqUrl: req.url, expectedToken, token })
    res.statusCode = 401
    res.end()
    return

  args = _.compact([
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
    res.setHeader("content-type", "text/html")
    res.statusCode = err.status
    res.end(networkFailures.get(file, err.status))
  .pipe(res)

module.exports = {
  create: (fileServerFolder) ->
    new Promise (resolve) ->
      token = random.id(64)

      srv = http.createServer (req, res) ->
        onRequest(req, res, token, fileServerFolder)

      allowDestroy(srv)

      srv.listen 0, '127.0.0.1', ->
        resolve({
          token

          port: ->
            srv.address().port

          address: ->
            "http://localhost:" + @port()

          close: ->
            srv.destroyAsync()
        })
}
