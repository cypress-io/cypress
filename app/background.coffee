HOST = "CHANGE_ME_HOST"
PATH = "CHANGE_ME_PATH"

client = io.connect(HOST, {path: PATH})

automation = {
  getAllCookies: (filter = {}, fn) ->
    chrome.cookies.getAll(filter, fn)
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
    else
      fail(id, {message: "No handler registered for: '#{msg}'"})

client.on "connect", ->
  client.emit("automation:connected")
