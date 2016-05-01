HOST = "CHANGE_ME_HOST"
PATH = "CHANGE_ME_PATH"

client = io.connect(HOST, {path: PATH})

automation = {
  getAllCookies: (filter = {}, fn) ->
    chrome.cookies.getAll(filter, fn)

  clearCookie: (url, name, fn) ->
    chrome.cookies.remove({url: url, name: name}, fn)

  getUrl: (cookie = {}) ->
    prefix = if cookie.secure then "https://" else "http://"
    prefix + cookie.domain + cookie.path

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

fail = (id, err) ->
  client.emit("automation:response", id, {
    __error: err.message
    __stack: err.stack
    __name:  err.name
  })

invoke = (method, id, args...) ->
  respond = (data) ->
    client.emit("automation:response", id, {response: data})

  try
    automation[method].apply(automation, args.concat(respond))
  catch err
    fail(id, err)

client.on "automation:request", (id, msg, data) ->
  switch msg
    when "get:cookies"
      invoke("getAllCookies", id, data)
    when "clear:cookies"
      invoke("clearCookies", id, data)
    else
      fail(id, {message: "No handler registered for: '#{msg}'"})

client.on "connect", ->
  client.emit("automation:connected")
