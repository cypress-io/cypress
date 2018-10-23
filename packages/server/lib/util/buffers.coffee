_   = require("lodash")
url = require("url")
debug = require("debug")("cypress:server:buffers")

buffers = []

module.exports = {
  all: -> buffers

  keys: -> _.map(buffers, "url")

  reset: ->
    debug("resetting buffers")

    buffers = []

  set: (obj = {}) ->
    buffers.push _.pick(obj, "url", "originalUrl", "jar", "stream", "response", "details")

  getByOriginalUrl: (str) ->
    _.find(buffers, {originalUrl: str})

  get: (str) ->
    find = (str) ->
      _.find(buffers, {url: str})

    b = find(str)

    return b if b

    parsed = url.parse(str)

    ## if we're on https and we have a port
    ## then attempt to find the buffer by
    ## slicing off the port since our buffer
    ## was likely stored without a port
    if parsed.protocol is "https:" and parsed.port
      parsed.host = parsed.host.split(":")[0]
      parsed.port = null

      find(parsed.format())

  take: (str) ->
    if buffer = @get(str)
      buffers = _.without(buffers, buffer)

    return buffer

}
