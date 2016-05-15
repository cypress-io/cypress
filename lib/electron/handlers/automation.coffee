_         = require("lodash")
Promise   = require("bluebird")
cookies   = require("./cookies")
Renderer  = require("./renderer")

firstOrNull = (cookies) ->
  ## normalize into null when empty array
  cookies[0] ? null

invoke = (method, data) ->
  Promise.try ->
    automation[method](data)

automation = {
  getSessionCookies: ->
    win = Renderer.get("PROJECT")
    win.webContents.session.cookies

  clear: (filter = {}) ->
    c = @getSessionCookies()

    clear = (cookie) =>
      cookies.remove(c, cookie)
      .return(cookie)

    @getAll(filter)
    .map(clear)

  getAll: (filter) ->
    cookies
    .get(@getSessionCookies(), filter)

  getCookies: (filter) ->
    @getAll(filter)

  getCookie: (filter) ->
    @getAll(filter)
    .then(firstOrNull)

  setCookie: (props = {}) ->
    ## resolve with the cookie props. the extension
    ## calls back with the cookie details but electron
    ## chrome API's do not. but it doesn't matter because
    ## we always send a fully complete cookie props object
    ## which can simply be returned.
    cookies
    .set(@getSessionCookies(), props)
    .return(props)

  clearCookie: (filter) ->
    @clear(filter)
    .then(firstOrNull)

  clearCookies: (filter) ->
    @clear(filter)

  verify: (data) ->
    Promise.resolve(true)
}

module.exports = {
  automation: automation

  perform: (msg, data) ->
    switch msg
      when "get:cookies"
        invoke("getCookies", data)
      when "get:cookie"
        invoke("getCookie", data)
      when "set:cookie"
        invoke("setCookie", data)
      when "clear:cookies"
        invoke("clearCookies", data)
      when "clear:cookie"
        invoke("clearCookie", data)
      when "is:automation:connected"
        invoke("verify", data)
      else
        Promise.reject new Error("No handler registered for: '#{msg}'")
}
