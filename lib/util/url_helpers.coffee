_     = require 'lodash'
Url   = require 'url'
jsUri = require "jsuri"

httpRe = /:\/\//
fileRe = /^file:\/\//

module.exports =
  isFile: (url) ->
    fileRe.test(url)

  isAbsolute: (url) ->
    httpRe.test(url) and not @isFile(url)

  isRelative: (url) ->
    not @isAbsolute(url) and not @isFile(url)

  ## if url is defined we assume its an absolute url
  detectScheme: (url = "") ->
    switch
      when @isFile(url)     then "file"
      when @isAbsolute(url) then "absolute"
      when @isRelative(url) then "relative"
      else
        throw new Error("Url: #{url} did not match 'absolute', 'relative', or 'file' scheme.")

  ## merges in everything except for query params + hashes
  mergeOrigin: (origin, redirect) ->
    originUrl   = Url.parse(origin)
    redirectUrl = Url.parse(redirect)

    _.each _.pick(redirectUrl, "protocol", "auth", "hostname", "port", "pathname"), (value, key) ->
      if not value?
        redirectUrl[key] = originUrl[key]

    redirectUrl.format()

  merge: (origin, redirect) ->
    originUrl   = Url.parse(origin, true)
    redirectUrl = Url.parse(redirect, true)

    _.each redirectUrl, (value, key) ->
      if not value?
        redirectUrl[key] = originUrl[key]

    redirectUrl.format()

  replaceHost: (original, remoteHost) ->
    original = new jsUri(original)
    remoteHost = new jsUri(remoteHost)

    original.setProtocol(remoteHost.protocol())
    original.setHost(remoteHost.host())
    original.setPort(remoteHost.port())

    original.toString()

  getOriginFromFqdnUrl: (url) ->
    ## the first character will always be a '/'
    ## so lets slice that off
    url = Url.parse(url.slice(1))
    if url.protocol and url.host
      url.pathname = ""
      url.search = ""
      url.hash = ""
      url.format()