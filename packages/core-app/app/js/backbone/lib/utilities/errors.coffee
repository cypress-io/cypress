@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  onerror = window.onerror

  _.extend App,
    catchUncaughtErrors: (options = {}) ->
      _.defaults options,
        init: true

      if options.init
        window.onerror = (msg, url, lineNum, colNum, err) ->
          App.error = err
          if _.isFunction(onerror)
            onerror.apply(@, arguments)
      else
        window.onerror = onerror