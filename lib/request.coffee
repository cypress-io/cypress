_       = require("lodash")
request = require("request-promise")

module.exports = {
  contentTypeIsJson: (response) ->
    response?.headers?["content-type"]?.includes("application/json")

  parseJsonBody: (body) ->
    try
      JSON.parse(body)
    catch e
      body

  normalizeResponse: (response) ->
    response = _.pick response, "statusCode", "body", "headers"

    ## normalize status
    response.status = response.statusCode
    delete response.statusCode

    ## if body is a string and content type is json
    ## try to convert the body to JSON
    if _.isString(response.body) and @contentTypeIsJson(response)
      response.body = @parseJsonBody(response.body)

    return response

  reduceCookieToArray: (c) ->
    _.reduce c, (memo, val, key) ->
      memo.push [key.trim(), val.trim()].join("=")
      memo
    , []

  createCookieString: (c) ->
    @reduceCookieToArray(c).join("; ")

  send: (options = {}) ->
    _.defaults options, {
      headers: {}
      cookies: {}
      auth: null
      json: false
    }

    _.extend options, {
      simple: false
      resolveWithFullResponse: true
    }

    if c = options.cookies
      options.headers["Cookie"] = @createCookieString(c)

    request(options).then @normalizeResponse.bind(@)

}