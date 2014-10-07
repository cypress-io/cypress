Promise       = require "bluebird"
fs            = Promise.promisifyAll(require("fs"))
request       = require "request-promise"
_             = require "lodash"
path          = require "path"
fsUtil        = require("../util/file_helpers")

module.exports = class extends require('events').EventEmitter
  handle: (req, res, opts) =>
    @emit "verbose", "handling request for #{req.session.proxyUrl}"

    @getContent(req.session.proxyUrl)
    .then(_.partialRight(@injectContent, opts.inject))
    .then(res.send.bind(res))
    .catch(
      _.partialRight(@errorHandler, res, req.session.proxyUrl)
    )

  injectContent: (content, toInject) ->
    Promise.resolve(
      content.replace(/<\/body>/, "#{toInject} </body>")
    )

  getContent: (url) ->
    if fsUtil.isRelativeRequest(url)
      return @getRelativeFileContent(url)

    if fsUtil.isFileProtocol(url)
      return @getFileContent(url)

    @getUrlContent(url)

  getRelativeFileContent: (p) ->
    fs.readFileAsync(path.join(process.cwd(), p), 'utf8')

  getFileContent: (p) ->
    fs.readFileAsync(p.slice(7), 'utf8')

  getUrlContent: (url) -> request.get(url)

  errorHandler: (e, res, url) ->
    res.status(500)
    .send("Error getting #{url} <pre>#{e.message}</pre>")
