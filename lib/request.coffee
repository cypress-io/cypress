_       = require("lodash")
r       = require("request")
rp      = require("request-promise")
tough   = require("tough-cookie")
moment  = require("moment")
Promise = require("bluebird")

Cookie = tough.Cookie
CookieJar = tough.CookieJar

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

newCookieJar = ->
  j = new CookieJar(undefined, {looseMode: true})

  ## match the same api signature as @request
  {
    _jar: j

    toJSON: ->
      j.toJSON()

    setCookie: (cookieOrStr, uri, options) ->
      j.setCookieSync(cookieOrStr, uri, options)

    getCookieString: (uri) ->
      j.getCookieStringSync(uri)

    getCookies: (uri) ->
      j.getCookiesSync(uri)
  }

flattenCookies = (cookies) ->
  _.reduce cookies, (memo, cookie) ->
    memo[cookie.name] = cookie.value
    memo
  , {}

reduceCookieToArray = (c) ->
  _.reduce c, (memo, val, key) ->
    memo.push [key.trim(), val.trim()].join("=")
    memo
  , []

createCookieString = (c) ->
  reduceCookieToArray(c).join("; ")

module.exports = {
  reduceCookieToArray: reduceCookieToArray

  createCookieString: createCookieString

  contentTypeIsJson: (response) ->
    ## TODO: use https://github.com/jshttp/type-is for this
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

  setJarCookies: (jar, automation) ->
    setCookie = (cookie) ->
      cookie.name = cookie.key

      ## TODO: fix this
      return if cookie.name and cookie.name.startsWith("__cypress")

      ## tough cookie provides javascript date
      ## formatted expires
      if e = cookie.expires
        ## which we convert into unix time
        cookie.expiry = moment(e).unix()

      automation("set:cookie", cookie)

    Promise.try ->
      store = jar.toJSON()

      Promise
      .map(store.cookies, setCookie)
      .filter (cookie) ->
        not _.isEmpty(cookie)

  sendStream: (automation, options = {}) ->
    _.defaults options, {
      headers: {}
      jar: true
    }

    ## create a new jar instance
    ## unless its falsy or already set
    if options.jar is true
      options.jar = newCookieJar()

    _.extend options, {
      strictSSL: false
    }

    setCookies = (cookies) =>
      return if _.isEmpty(cookies)

      options.headers["Cookie"] = createCookieString(cookies)

    send = =>
      str = r(options)
      str.getJar = -> options.jar
      str

    automation("get:cookies", {url: options.url})
    .then(flattenCookies)
    .then(setCookies)
    .then(send)

  send: (automation, options = {}) ->
    _.defaults options, {
      headers: {}
      gzip: true
      jar: true
    }

    ## create a new jar instance
    ## unless its falsy or already set
    if options.jar is true
      options.jar = newCookieJar()

    _.extend options, {
      strictSSL: false
      simple: false
      resolveWithFullResponse: true
    }

    setCookies = (cookies) =>
      return if _.isEmpty(cookies)

      options.headers["Cookie"] = createCookieString(cookies)

    send = =>
      ms = Date.now()

      ## dont send in domain
      options = _.omit(options, "domain")

      rp(options)
      .then(@normalizeResponse.bind(@))
      .then (resp) =>
        resp.duration = Date.now() - ms

        if options.jar
          @setJarCookies(options.jar, automation)
          .return(resp)
        else
          resp

    if c = options.cookies
      ## if we have a cookie object then just
      ## send the request up!
      if _.isObject(c)
        setCookies(c)
        send()
      else
        ## else go get the cookies first
        ## then make the request

        ## TODO: we can simply use the 'url' property on the cookies API
        ## which automatically pulls all of the cookies that would be
        ## set for that url!
        automation("get:cookies", {url: options.url})
        .then(flattenCookies)
        .then(setCookies)
        .then(send)
    else
      send()

}