Promise       = require "bluebird"
fs            = Promise.promisifyAll(require("fs"))
request       = require "request-promise"
_             = require "lodash"
path          = require "path"
fsUtil        = new (require("../util/file_helpers"))

module.exports = class extends require('events').EventEmitter
  handle: (req, res, opts = {}) =>
    uri = req.url.split("/__remote/").join("")
    @emit "verbose", "handling request for #{uri}"

    @getContent(uri)
    .then(_.partialRight(@injectContent, opts.inject))
    .then(res.send.bind(res))
    .catch(
      _.partialRight(@errorHandler, res, uri)
    )

  injectContent: (content, toInject) ->
    toInject ?= ""

    Promise.resolve(
      content.replace(/<head>/, "<head> #{toInject}")
    )

  getContent: (url) ->
    switch type = fsUtil.detectType(url)
      when "relative" then @getRelativeFileContent(url)
      when "file"     then @getFileContent(url)
      when "url"      then @getUrlContent(url)
      else
        throw new Error "Unable to handle type #{type}"

  getRelativeFileContent: (p) ->
    fs.readFileAsync(path.join(process.cwd(), p), 'utf8')

  getFileContent: (p) ->
    fs.readFileAsync(p.slice(7), 'utf8')

  getUrlContent: (url) ->
    request.get(url)

  errorHandler: (e, res, url) ->
    res.status(500)
    .send("Error getting #{url} <pre>#{e.message}</pre>")
