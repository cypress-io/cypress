_           = require("lodash")
uuid        = require("uuid")
Promise     = require("bluebird")
Cookies     = require("./cookies")
Screenshot  = require("./screenshot")

assertValidOptions = (options, keys...) ->
  _.each keys, (key) ->
    if key not of options
      throw new Error("Automation requires the key: #{key}. You passed in:", options)

module.exports = {
  create: (cyNamespace, cookieNamespace, screenshotsFolder) ->
    # assertValidOptions(options, "namespace", "cookie", "screenshotsFolder")

    requests = {}

    middleware = null

    reset = ->
      middleware = {
        onPush: null
        onBeforeRequest: null
        onRequest: null
        onResponse: null
        onAfterResponse: null
      }

    ## set the middleware
    reset()

    cookies    = Cookies(cyNamespace, cookieNamespace)
    screenshot = Screenshot(screenshotsFolder)

    get = (fn) ->
      middleware[fn]

    invokeAsync = (fn, args...) ->
      Promise
      .try ->
        if fn = get(fn)
          fn.apply(null, args)

    requestAutomationResponse = (message, data, fn) ->
      new Promise (resolve, reject) =>
        id = uuid.v4()

        requests[id] = (obj) ->
          ## normalize the error from automation responses
          if e = obj.__error
            err = new Error(e)
            err.name = obj.__name
            err.stack = obj.__stack
            reject(err)
          else
            ## normalize the response
            resolve(obj.response)

        ## callback onAutomate with the right args
        fn(message, data, id)

    automationValve = (message, fn) ->
      return (msg, data) ->
        ## enable us to omit message
        ## argument
        if not data
          data = msg
          msg  = message

        ## if we have an onRequest function
        ## then just invoke that
        if onReq = get("onRequest")
          onReq(msg, data)
        else
          ## do the default
          requestAutomationResponse(msg, data, fn)

    normalize = (message, data, automate) ->
      Promise.try ->
        switch message
          when "take:screenshot"
            screenshot.capture(data, automate)
          when "get:cookies"
            cookies.getCookies(data, automate)
          when "get:cookie"
            cookies.getCookie(data, automate)
          when "set:cookie"
            cookies.setCookie(data, automate)
          when "clear:cookies"
            cookies.clearCookies(data, automate)
          when "clear:cookie"
            cookies.clearCookie(data, automate)
          when "change:cookie"
            cookies.changeCookie(data)
          else
            automate(data)

    return {
      _requests: requests

      reset: ->
        ## TODO: there's gotta be a better
        ## way to manage this state. i don't
        ## like automation being a singleton
        ## that's kept around between browsers
        ## opening and closing
        { onPush } = middleware

        reset()

        middleware.onPush = onPush
        middleware

      get: -> middleware

      use: (middlewares = {}) ->
        _.extend(middleware, middlewares)

      push: (message, data) ->
        normalize(message, data)
        .then (data) ->
          invokeAsync("onPush", message, data) if data

      request: (message, data, fn) ->
        ## curry in the message + callback function
        ## for obtaining the external automation data
        automate = automationValve(message, fn)

        ## enable us to tap into before making the request
        invokeAsync("onBeforeRequest", message, data)
        .then ->
          normalize(message, data, automate)
        .then (resp) ->
          invokeAsync("onAfterResponse", message, data, resp)
          .return(resp)

      response: (id, resp) ->
        if request = requests[id]
          delete request[id]
          request(resp)
    }
}
