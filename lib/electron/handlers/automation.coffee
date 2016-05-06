Promise   = require("bluebird")
extension = require("@cypress/core-extension")
cookies   = require("./cookies")
Renderer  = require("./renderer")

firstOrNull = (cookies) ->
  ## normalize into null when empty array
  cookies[0] ? null

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
    .map(extension.cookieProps)

  getCookies: (filter) ->
    @getAll(filter)

  getCookie: (filter) ->
    @getAll(filter)
    .then(firstOrNull)

  setCookie: (props = {}) ->
    cookies
    .set(@getSessionCookies(), props)
    .then(extension.cookieProps)

  clearCookie: (filter) ->
    @clear(filter)
    .then(firstOrNull)

  clearCookies: (filter) ->
    @clear(filter)
}

module.exports = {
  automation: automation

  invoke: (method, data) ->
    Promise.try ->
      automation[method](data)

  perform: (msg, data) ->
    switch msg
      when "get:cookies"
        @invoke("getCookies", data)
      when "get:cookie"
        @invoke("getCookie", data)
      when "set:cookie"
        @invoke("setCookie", data)
      when "clear:cookies"
        @invoke("clearCookies", data)
      when "clear:cookie"
        @invoke("clearCookie", data)
      else
        Promise.reject new Error("No handler registered for: '#{msg}'")
}
