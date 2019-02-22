map     = require("lodash/map")
pick    = require("lodash/pick")
once    = require("lodash/once")
trim    = require("lodash/trim")
url     = require("url")
Promise = require("bluebird")

HOST = "CHANGE_ME_HOST"
PATH = "CHANGE_ME_PATH"

httpRe = /^http/

firstOrNull = (cookies) ->
  ## normalize into null when empty array
  cookies[0] ? null

connect = (host, path, io) ->
  io ?= global.io

  ## bail if io isnt defined
  return if not io

  listenToCookieChanges = once ->
    chrome.cookies.onChanged.addListener (info) ->
      if info.cause isnt "overwrite"
        client.emit("automation:push:request", "change:cookie", info)

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
  client = io.connect(host, {path: path, transports: ["websocket"]})

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

  client.on "connect", ->
    listenToCookieChanges()

    client.emit("automation:client:connected")

  return client

## initially connect
connect(HOST, PATH, global.io)

connectProxy = ->
  hostParts = url.parse(HOST)
  proxyConfig = {
    value: {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: trim(hostParts.protocol, ":"),
          host: hostParts.hostname
          port: parseInt(hostParts.port)
        },
        bypassList: ["<-loopback>"]
      },
    },
    scope: "regular"
  }

  chrome.proxy.onProxyError.addListener (obj) ->
    console.error('Proxy error: ', obj)

  chrome.proxy.settings.set proxyConfig, () ->
    chrome.proxy.settings.get {}, (obj) ->
      console.log('Loaded proxy: ', obj)

if global.chrome
  do once ->
    connectProxy()

automation = {
  connect: connect

  getUrl: (cookie = {}) ->
    prefix = if cookie.secure then "https://" else "http://"
    prefix + cookie.domain + cookie.path

  clear: (filter = {}) ->
    clear = (cookie) =>
      new Promise (resolve, reject) =>
        url = @getUrl(cookie)
        props = {url: url, name: cookie.name}
        chrome.cookies.remove props, (details) ->
          if details
            resolve(cookie)
          else
            err = new Error("Removing cookie failed for: #{JSON.stringify(props)}")
            reject(chrome.runtime.lastError ? err)

    @getAll(filter)
    .map(clear)

  getAll: (filter = {}) ->
    get = ->
      new Promise (resolve) ->
        chrome.cookies.getAll(filter, resolve)

    get()

  getCookies: (filter, fn) ->
    @getAll(filter)
    .then(fn)

  getCookie: (filter, fn) ->
    @getAll(filter)
    .then(firstOrNull)
    .then(fn)

  setCookie: (props = {}, fn) ->
    set = =>
      new Promise (resolve, reject) =>
        ## only get the url if its not already set
        props.url ?= @getUrl(props)
        chrome.cookies.set props, (details) ->
          switch
            when details
              resolve(details)
            when err = chrome.runtime.lastError
              reject(err)
            else
              ## the cookie callback could be null such as the
              ## case when expirationDate is before now
              resolve(null)

    set()
    .then(fn)

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
    chrome.windows.getCurrent (window) ->
      chrome.windows.update window.id, {focused: true}, ->
        fn()

  query: (data) ->
    code = "var s; (s = document.getElementById('#{data.element}')) && s.textContent"

    query = ->
      new Promise (resolve) ->
        chrome.tabs.query({windowType: "normal"}, resolve)

    queryTab = (tab) ->
      new Promise (resolve, reject) ->
        chrome.tabs.executeScript tab.id, {code: code}, (result) ->
          if result and result[0] is data.string
            resolve()
          else
            reject(new Error)

    query()
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
    new Promise (resolve) ->
      chrome.windows.getLastFocused(resolve)

  takeScreenshot: (fn) ->
    @lastFocusedWindow()
    .then (win) ->
      new Promise (resolve, reject) ->
        chrome.tabs.captureVisibleTab win.id, {format: "png"}, (dataUrl) ->
          if dataUrl
            resolve(dataUrl)
          else
            reject(chrome.runtime.lastError)
    .then(fn)
}

module.exports = automation
