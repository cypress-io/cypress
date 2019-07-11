_           = require("lodash")
mime        = require("mime")
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
    get = (val, def) ->
      decodeURI(req.get(val) ? def)

    delay    = ~~get("x-cypress-delay")
    status   = get("x-cypress-status", 200)
    headers  = get("x-cypress-headers", null)
    response = get("x-cypress-response", "")

    respond = =>
      ## figure out the stream interface and pipe these
      ## chunks to the response
      @getResponse(response, config)
      .then (resp = {}) =>
        { data, encoding } = resp

        ## grab content-type from x-cypress-headers if present
        headers = @parseHeaders(headers, data)

        ## enable us to respond with other encodings
        ## like binary
        encoding ?= "utf8"

        ## TODO: if data is binary then set
        ## content-type to binary/octet-stream
        if _.isObject(data)
          data = JSON.stringify(data)

        chunk = Buffer.from(data, encoding)

        headers["content-length"] = chunk.length

        res
        .set(headers)
        .status(status)
        .end(chunk)
      .catch (err) ->
        res
        .status(400)
        .send({__error: err.stack})

    if delay > 0
      Promise.delay(delay).then(respond)
    else
      respond()

  _get: (resp, config) ->
    options = {}

    file = resp.replace(fixturesRe, "")

    [filePath, encoding] = file.split(",")

    if encoding
      options.encoding = encoding

    fixture.get(config.fixturesFolder, filePath, options)
    .then (bytes) ->
      {data: bytes, encoding: encoding}

  getResponse: (resp, config) ->
    if fixturesRe.test(resp)
      @_get(resp, config)
    else
      Promise.resolve({data: resp})

  parseContentType: (response) ->
    ret = (type) ->
      mime.lookup(type) #+ "; charset=utf-8"

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
