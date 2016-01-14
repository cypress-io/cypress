@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->
  msgs = {}

  ipc = window.ipc

  ipc.on "response", (event, obj = {}) ->
    {id, __error, data} = obj

    ## standard node callback implementation
    if fn = msgs[id]
      fn(__error, data)

  App.ipc = (args...) ->
    ## generate an id
    id = Math.random()

    ## pass in request, id, and remaining args
    ipc.send.apply ipc, ["request", id].concat(args)

    ## return a promise interface and at the
    ## same time store this callback function
    ## by id in msgs
    new Promise (resolve, reject) ->
      msgs[id] = (err, data) ->
        if err
          reject(err)
        else
          resolve(data)