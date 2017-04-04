_       = require("lodash")
uuid    = require("uuid")
Promise = require("bluebird")

assertValidOptions = (options, keys...) ->
  _.each keys, (key) ->
    if key not of options
      throw new Error("Automation requires the key: #{key}. You passed in:", options)

module.exports = {
  create: (namespace, cookie, screenshotsFolder) ->
    # assertValidOptions(options, "namespace", "cookie", "screenshotsFolder")

    requests = {}

    middleware = {
      onPush: null
      onBeforeRequest: null
      onRequest: null
      onResponse: null
      onAfterResponse: null
    }

    get = (fn) ->
      middleware[fn]

    invokeAsync = (fn, args...) ->
      Promise
      .try ->
        if fn = get(fn)
          fn.apply(null, args)

    return {
      _requests: requests

      _promisifyRequest: (obj) ->
        new Promise (resolve, reject) =>
          ## normalize the error from automation responses
          if e = obj.__error
            err = new Error(e)
            err.name = obj.__name
            err.stack = obj.__stack
            reject(err)
          else
            ## normalize the response
            resolve(obj.response)

      use: (middlewares = {}) ->
        _.extend(middleware, middlewares)

      push: (message, data) ->
        ## TODO: normalize the automation message
        normalize(message, data)
        .then (data) ->
          invokeAsync("onPush", message, data)

      request: (message, data, fn) ->
        ## enable us to tap into before making the request
        invokeAsync("onBeforeRequest", message, data)
        .then =>
          ## if we have an onRequest function
          ## then just invoke that
          if fn = get("onRequest")
            fn(message, data)
          else
            ## do the default
            id = uuid.v4()

            ## callback onAutomate with the right args
            fn(id, message, data)

            requests[id] = @_promisifyRequest
        .then (resp) ->
          invokeAsync("onAfterResponse", message, data, resp)
          .return(resp)

      response: (id, resp) ->
        if request = requests[id]
          delete request[id]
          request(resp)
    }
}
