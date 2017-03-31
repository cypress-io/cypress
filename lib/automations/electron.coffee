electron = require("electron")

module.exports = {
  create: (url, options = {}) ->
    win = Renderer.create()

    return {
      visit: (url) ->

      setProxy: (proxyServer) ->
        new Promise (resolve) ->
          win.webContents.session.setProxy({
            proxyRules: proxyServer
          }, resolve)

      automate: (msg, data) ->
        perform = (method, data) =>
          Promise.try =>
            @_automations[method](data)

        switch msg
          when "get:cookies"
            perform("getCookies", data)
          when "get:cookie"
            perform("getCookie", data)
          when "set:cookie"
            perform("setCookie", data)
          when "clear:cookies"
            perform("clearCookies", data)
          when "clear:cookie"
            perform("clearCookie", data)
          when "is:automation:connected"
            perform("isAutomationConnected", data)
          when "take:screenshot"
            perform("takeScreenshot")
          else
            Promise.reject new Error("No automation handler registered for: '#{msg}'")

      _automations: {
        getSessionCookies: ->
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

        getCookies: (filter) ->
          @getAll(filter)

        getCookie: (filter) ->
          @getAll(filter)
          .then(firstOrNull)

        setCookie: (props = {}) ->
          ## resolve with the cookie props. the extension
          ## calls back with the cookie details but electron
          ## chrome API's do not. but it doesn't matter because
          ## we always send a fully complete cookie props object
          ## which can simply be returned.
          cookies
          .set(@getSessionCookies(), props)
          .return(props)

        clearCookie: (filter) ->
          @clear(filter)
          .then(firstOrNull)

        clearCookies: (filter) ->
          @clear(filter)

        isAutomationConnected: (data) ->
          Promise.resolve(true)

        takeScreenshot: ->
          new Promise (resolve) ->
            win.capturePage (img) ->
              resolve(img.toDataURL())
      }

    }
}
