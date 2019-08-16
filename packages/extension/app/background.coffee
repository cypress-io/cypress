map     = require("lodash/map")
pick    = require("lodash/pick")
once    = require("lodash/once")
Promise = require("bluebird")
client  = require("./client")

httpRe = /^http/

firstOrNull = (cookies) ->
  ## normalize into null when empty array
  cookies[0] ? null

connect = (host, path) ->
  listenToCookieChanges = once ->
    browser.cookies.onChanged.addListener (info) ->
      if info.cause isnt "overwrite"
        ws.emit("automation:push:request", "change:cookie", info)

  fail = (id, err) ->
    ws.emit("automation:response", id, {
      __error: err.message
      __stack: err.stack
      __name:  err.name
    })

  invoke = (method, id, args...) ->
    respond = (data) ->
      ws.emit("automation:response", id, {response: data})

    Promise.try ->
      automation[method].apply(automation, args.concat(respond))
    .catch (err) ->
      fail(id, err)

  ws = client.connect(host, path)

  ws.on "automation:request", (id, msg, data) ->
    switch msg
      when "get:cookies"
        invoke("getCookies", id, data)
      when "get:cookie"
        invoke("getCookie", id, data)
      when "set:cookie"
        invoke("setCookie", id, data)
      when "clear:cookies"
        invoke("clearCookies", id, data)
      when "clear:cookie"
        invoke("clearCookie", id, data)
      when "is:automation:client:connected"
        invoke("verify", id, data)
      when "focus:browser:window"
        invoke("focus", id)
      when "take:screenshot"
        invoke("takeScreenshot", id)
      else
        fail(id, {message: "No handler registered for: '#{msg}'"})

  ws.on "connect", ->
    listenToCookieChanges()

    ws.emit("automation:client:connected")

  return ws
  
automation = {
  connect

  getUrl: (cookie = {}) ->
    prefix = if cookie.secure then "https://" else "http://"
    prefix + cookie.domain + cookie.path

  clear: (filter = {}) ->
    clear = (cookie) =>
      url = @getUrl(cookie)
      props = {url: url, name: cookie.name}

      throwError = (err) ->
        throw (err ? new Error("Removing cookie failed for: #{JSON.stringify(props)}"))

      Promise.try ->
        browser.cookies.remove(props)
      .then (details) ->
        if details
          return cookie
        else
          throwError()
      .catch(throwError)

    @getAll(filter)
    .map(clear)

  getAll: (filter = {}) ->
    Promise.try ->
      browser.cookies.getAll(filter)

  getCookies: (filter, fn) ->
    @getAll(filter)
    .then(fn)

  getCookie: (filter, fn) ->
    @getAll(filter)
    .then(firstOrNull)
    .then(fn)

  setCookie: (props = {}, fn) ->
    ## only get the url if its not already set
    props.url ?= @getUrl(props)
    Promise.try ->
      browser.cookies.set(props)
    .then (details) ->
      ## the cookie callback could be null such as the
      ## case when expirationDate is before now
      return fn(details or null)

  clearCookie: (filter, fn) ->
    @clear(filter)
    .then(firstOrNull)
    .then(fn)

  clearCookies: (filter, fn) ->
    @clear(filter)
    .then(fn)

  focus: (fn) ->
    ## lets just make this simple and whatever is the current
    ## window bring that into focus
    ##
    ## TODO: if we REALLY want to be nice its possible we can
    ## figure out the exact window that's running Cypress but
    ## that's too much work with too little value at the moment
    Promise.try ->
      browser.windows.getCurrent()
    .then (window) ->
      browser.windows.update(window.id, {focused: true})
    .then(fn)

  query: (data) ->
    code = "var s; (s = document.getElementById('#{data.element}')) && s.textContent"

    queryTab = (tab) ->
      Promise.try ->
        browser.tabs.executeScript(tab.id, {code: code})
      .then (results) ->
        if not results or results[0] isnt data.string
          throw new Error("Executed script did not return result")

    Promise.try ->
      browser.tabs.query({windowType: "normal"})
    .filter (tab) ->
      ## the tab's url must begin with
      ## http or https so that we filter out
      ## about:blank and chrome:// urls
      ## which will throw errors!
      httpRe.test(tab.url)
    .then (tabs) ->
      ## generate array of promises
      map(tabs, queryTab)
    .any()

  verify: (data, fn) ->
    @query(data)
    .then(fn)

  lastFocusedWindow: ->
    Promise.try ->
      browser.windows.getLastFocused()

  takeScreenshot: (fn) ->
    @lastFocusedWindow()
    .then (win) ->
      browser.tabs.captureVisibleTab(win.id, {format: "png"})
    .then (dataUrl) ->
      fn(dataUrl)
}

module.exports = automation
