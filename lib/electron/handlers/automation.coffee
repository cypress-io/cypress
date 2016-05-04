Promise   = require("bluebird")
extension = require("@cypress/core-extension")
cookies   = require("./cookies")
Renderer  = require("./renderer")

fail = (id, err, cb) ->
  cb(id, {
    __error: err.message
    __stack: err.stack
    __name:  err.name
  })

firstOrNull = (cookies) ->
  ## normalize into null when empty array
  cookies[0] ? null

automation = {
  getSessionCookies: ->
    win = Renderer.get("PROJECT")
    cookies.promisify(win.webContents.session.cookies)

  clear: (filter = {}) ->
    c = @getSessionCookies()

    clear = (cookie) =>
      cookies.remove(c, cookie)
      .return(cookie)

    @getAll(filter)
    .map(clear)

  getAll: (filter) ->
    console.log "getAll", filter
    cookies
    .get(@getSessionCookies(), filter)
    .map(extension.cookieProps)

  getCookies: (filter, cb) ->
    @getAll(filter)
    .then(cb)

  getCookie: (filter, cb) ->
    @getAll(filter)
    .then(firstOrNull)
    .then(cb)

  setCookie: (props = {}, cb) ->
    cookies
    .set(@getSessionCookies(), props)
    .then(extension.cookieProps)
    .then(cb)

  clearCookie: (filter, cb) ->
    @clear(filter)
    .then(firstOrNull)
    .then(cb)

  clearCookies: (filter, cb) ->
    @clear(filter)
    .then(cb)
}

module.exports = {
  automation: automation

  invoke: (method, id, data, cb) ->
    respond = (resp) ->
      cb(id, {response: resp})

    Promise.try ->
      automation[method].call(automation, data, respond)
    .catch (err) ->
      fail(id, err, cb)

  perform: (id, msg, data, cb) ->
    switch msg
      when "get:cookies"
        @invoke("getCookies", id, data, cb)
      when "get:cookie"
        @invoke("getCookie", id, data, cb)
      when "set:cookie"
        @invoke("setCookie", id, data, cb)
      when "clear:cookies"
        @invoke("clearCookies", id, data, cb)
      when "clear:cookie"
        @invoke("clearCookie", id, data, cb)
      else
        fail(id, {message: "No handler registered for: '#{msg}'"}, cb)
}
