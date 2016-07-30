_ = require("lodash")

buffers = {}

module.exports = {
  all: -> buffers

  reset: ->
    buffers = {}

  set: (obj = {}) ->
    buffers[obj.url] = _.pick(obj, "url", "originalUrl", "jar", "stream", "response", "details")

  getByOriginalUrl: (url) ->
    _.find buffers, {originalUrl: url}

  get: (url) ->
    buffers[url]

  take: (url) ->
    buffer = @get(url)

    if buffer
      delete buffers[url]

    return buffer

}