_           = require("lodash")
mime        = require("mime")
str         = require("string-to-stream")
Promise     = require("bluebird")
fixture     = require("../fixture")

fixturesRe = /^(fx:|fixture:)/
htmlLikeRe = /<.+>[\s\S]+<\/.+>/

isValidJSON = (text) ->
  return true if _.isObject(text)

  try
    o = JSON.parse(text)
    return _.isObject(o)
  catch
    false

  return false

module.exports = {
  handle: (req, res, config, next) ->
    delay    = ~~req.get("x-cypress-delay")
    status   = req.get("x-cypress-status")   ? 200
    headers  = req.get("x-cypress-headers")  ? null
    response = req.get("x-cypress-response") ? ""

    respond = =>
      ## figure out the stream interface and pipe these
      ## chunks to the response
      @getResponse(response, config)
        .then (resp) =>
          headers = @parseHeaders(headers, resp)

          ## grab content-type from x-cypress-headers if present
          res
            .set(headers)
            .status(status)
            .send(resp)
        .catch (err) ->
          res
            .status(400)
            .send({__error: err.message})

    if delay > 0
      Promise.delay(delay).then(respond)
    else
      respond()

  _get: (resp, config) ->
    file = resp.replace(fixturesRe, "")
    fixture.get(config.fixturesFolder, file)

  getStream: (resp) ->
    if fixturesRe.test(resp)
      @_get(resp).then (contents) ->
        str(contents)
    else
      str(resp)

  getResponse: (resp, config) ->
    if fixturesRe.test(resp)
      @_get(resp, config)
    else
      Promise.resolve(resp)

  parseContentType: (response) ->
    ret = (type) ->
      mime.lookup(type)

    switch
      when isValidJSON(response)
        ret("json")
      when htmlLikeRe.test(response)
        ret("html")
      else
        ret("text")

  parseHeaders: (headers, response) ->
    try
      headers = JSON.parse(headers)

    headers ?= {}
    headers["content-type"] ?= @parseContentType(response)

    return headers

}