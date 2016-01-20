@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->
  msgs = {}

  createIpc = ->
    console.warn("Missing 'ipc'. Polyfilling temporarily.")

    return {
      on: ->
      send: ->
    }

  ipc = window.ipc ? createIpc()

  ipc.on "response", (event, obj = {}) ->
    {id, __error, data} = obj

    ## standard node callback implementation
    if fn = msgs[id]
      fn(__error, data)

  App.ipc = (args...) ->
    ## our ipc interface can either be a standard
    ## node callback or a promise interface
    ## we support both because oftentimes we want
    ## to our async request to be resolved with a
    ## singular value, and other times we want it
    ## to be called multiple times akin to a stream

    ## generate an id
    id = Math.random()

    ## get the last argument
    lastArg = args.pop()

    ## enable the last arg to be a function
    ## which changes this interface from being
    ## a promise to just calling the callback
    ## function directly
    if lastArg and _.isFunction(lastArg)
      fn = ->
        msgs[id] = lastArg
    else
      ## push it back onto the array
      args.push(lastArg)

      fn = ->
        ## return a promise interface and at the
        ## same time store this callback function
        ## by id in msgs
        new Promise (resolve, reject) ->
          msgs[id] = (err, data) ->
            if err
              reject(err)
            else
              resolve(data)

    ## pass in request, id, and remaining args
    ipc.send.apply ipc, ["request", id].concat(args)

    return fn()