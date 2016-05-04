Promise = require("bluebird")
pick    = require("lodash/pick")

HOST = "CHANGE_ME_HOST"
PATH = "CHANGE_ME_PATH"

## match the w3c webdriver spec on return cookies
## https://w3c.github.io/webdriver/webdriver-spec.html#cookies
COOKIE_PROPERTIES = "name value path domain secure httpOnly expiry".split(" ")

cookieProps = (cookie) ->
  pick(cookie, COOKIE_PROPERTIES)

connect = (host, path) ->
  fail = (id, err) ->
    client.emit("automation:response", id, {
      __error: err.message
      __stack: err.stack
      __name:  err.name
    })

  invoke = (method, id, args...) ->
    respond = (data) ->
      client.emit("automation:response", id, {response: data})

    Promise.try ->
      automation[method].apply(automation, args.concat(respond))
    .catch (err) ->
      fail(id, err)

  ## cannot use required socket here due
  ## to bug in socket io client with browserify
  client = io.connect(host, {path: path})

  client.on "automation:request", (id, msg, data) ->
    switch msg
      when "get:cookies"
        invoke("getCookies", id, data)
      when "get:cookie"
        invoke("getCookie", id, data)
      when "set:cookie"
        invoke("setCookie", id, data)
      when "clear:cookies"
        invoke("clearCookies", id, data)
      else
        fail(id, {message: "No handler registered for: '#{msg}'"})

  client.on "connect", ->
    client.emit("automation:connected")

  return client

## initially connect
connect(HOST, PATH)

automation = {
  connect: connect

  getUrl: (cookie = {}) ->
    prefix = if cookie.secure then "https://" else "http://"
    prefix + cookie.domain + cookie.path

  getAll: (filter = {}) ->
    getAll = ->
      new Promise (resolve) ->
        chrome.cookies.getAll(filter, resolve)

    getAll()
    .map(cookieProps)

  getCookies: (filter, fn) ->
    @getAll(filter)
    .then(fn)

  getCookie: (filter, fn) ->
    @getAll(filter)
    .then (cookies) ->
      ## normalize into null when empty array
      cookies[0] ? null
    .then(fn)

  setCookie: (props = {}, fn) ->
    set = ->
      new Promise (resolve, reject) ->
        chrome.cookies.set props, (details) ->
          if details
            resolve(cookieProps(details))
          else
            reject(chrome.runtime.lastError)

    set()
    .then(fn)

  clearCookie: (url, name, fn) ->
    chrome.cookies.remove({url: url, name: name}, fn)

  clearCookies: (filter = {}, fn) ->
    ## by default remove all
    if _.isEmpty(filter)
      @getAllCookies {}, (cookies) =>
        cleared = []
        ret = ->
          fn({
            cleared: cleared
            count: cleared.length
          })

        ## handle null as rejected promise (?)
        callback = _.after(cookies.length, ret)

        _.each cookies, (cookie) =>
          url = @getUrl(cookie)
          @clearCookie url, cookie.name, (details) ->
            ## if details is null then removing the cookie
            ## failed and we should check chrome.runtime.lastError
            ## for the error
            cleared.push(cookie)
            callback()
}

module.exports = automation
