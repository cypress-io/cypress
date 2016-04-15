cookies  = require("./cookies")
Renderer = require("./rendere")

fail = (id, err, cb) ->
  cb(id, {
    __error: err.message
    __stack: err.stack
    __name:  err.name
  })

automation = {
  getAllCookies: (filter = {}, cb) ->
    win = Renderer.get("PROJECT")

    cookies
    .get(win.session.cookies, filter)
    .then(cb)
}

module.exports = {
  invoke: (method, id, data, cb) ->
    respond = (resp) ->
      cb(id, {response: resp})

    try
      automation[method].call(automation, data, respond)
      .catch (err) ->
        fail(id, err, cb)
    catch err
      fail(id, err, cb)

  perform: (id, msg, data, cb) ->
    switch msg
      when "get:cookies"
        @invoke("getAllCookies", id, data, cb)
      else
        fail(id, {message: "No handler registered for: '#{msg}'"}, cb)
}
