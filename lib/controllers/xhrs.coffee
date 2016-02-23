_           = require("lodash")
mime        = require("mime")
request     = require("request")
str         = require("string-to-stream")
Promise     = require("bluebird")
Fixture     = require("../fixture")

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

class Xhr
  constructor: (app) ->
    if not (@ instanceof Xhr)
      return new Xhr(app)

    if not app
      throw new Error("Instantiating controllers/xhr requires an app!")

    @app = app

  getStream: (resp) ->
    if fixturesRe.test(resp)
      fixture = resp.replace(fixturesRe, "")
      Fixture(@app).get(fixture).then (contents) ->
        str(contents)
    else
      str(resp)

  getResponse: (resp) ->
    if fixturesRe.test(resp)
      fixture = resp.replace(fixturesRe, "")
      Fixture(@app).get(fixture)
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

  handleXhr: (req, res, next) ->
    delay    = ~~req.get("x-cypress-delay")
    status   = req.get("x-cypress-status")   ? 200
    headers  = req.get("x-cypress-headers")  ? null
    response = req.get("x-cypress-response") ? ""

    respond = =>
      ## figure out the stream interface and pipe these
      ## chunks to the response
      @getResponse(response)
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

module.exports = Xhr