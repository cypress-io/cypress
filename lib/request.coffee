_       = require("lodash")
urlUtil = require("url")
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

  extractDomain: (url) ->
    ## parse the hostname from the url
    urlUtil.parse(url).hostname

  send: (automation, options = {}) ->
    _.defaults options, {
      headers: {}
      gzip: true
    }

    _.extend options, {
      strictSSL: false
      simple: false
      resolveWithFullResponse: true
    }

    flattenCookies = (cookies) ->
      _.reduce cookies, (memo, cookie) ->
        memo[cookie.name] = cookie.value
        memo
      , {}

    setCookies = (cookies) =>
      options.headers["Cookie"] = @createCookieString(cookies)

    send = =>
      ms = Date.now()

      ## dont send in domain
      options = _.omit(options, "domain")

      request(options)
      .then(@normalizeResponse.bind(@))
      .then (resp) ->
        resp.duration = Date.now() - ms

        return resp

    if c = options.cookies
      ## if we have a cookie object then just
      ## send the request up!
      if _.isObject(c)
        setCookies(c)
        send()
      else
        ## else go get the cookies first
        ## then make the request
        automation("get:cookies", {domain: options.domain ? @extractDomain(options.url)})
        .then(flattenCookies)
        .then(setCookies)
        .then(send)
    else
      send()

}