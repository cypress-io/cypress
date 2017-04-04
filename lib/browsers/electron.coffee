_             = require("lodash")
Promise       = require("bluebird")
extension     = require("@cypress/core-extension")
BrowserWindow = require("electron").BrowserWindow

firstOrNull = (cookies) ->
  ## normalize into null when empty array
  cookies[0] ? null

getUrl = (props) ->
  extension.getCookieUrl(props)

module.exports = {
  _render: (url, options = {}) ->
    _.defaults options,
      recordFrameRate: null
      onPaint: null
      onFocus: ->
      onBlur: ->
      onClose: ->
      onCrashed: ->
      onNewWindow: ->

    args = _.defaults {}, options, {
      width:             1280
      height:            720
      show:              true
      frame:             true
      devTools:          true
      proxyServer:       null
      chromeWebSecurity: true
      webPreferences: {
        nodeIntegration:      false
        backgroundThrottling: false
      }
    }

    if args.show is false
      args.webPreferences.offscreen = true

    if options.chromeWebSecurity is false
      args.webPreferences.webSecurity = false

    win = new BrowserWindow(args)

    # win.on "blur", ->
    #   options.onBlur.apply(win, arguments)

    # win.on "focus", ->
    #   options.onFocus.apply(win, arguments)

    win.webContents.on "crashed", ->
      options.onCrashed.apply(win, arguments)

    win.webContents.on "new-window", ->
      options.onNewWindow.apply(win, arguments)

    # win.once "closed", ->
      # win.webContents.removeAllListeners()
      # win.removeAllListeners()
      # options.onClose()

    ## open dev tools if they're true
    if args.devTools
      ## TODO: we may not want to detach these
      win.webContents.openDevTools({detach: true})

    if options.onPaint
      setFrameRate = (num) ->
        if win.webContents.getFrameRate() isnt num
          win.webContents.setFrameRate(num)

      win.webContents.on "paint", (event, dirty, image) ->
        if fr = options.recordFrameRate
          setFrameRate(fr)

        options.onPaint.apply(win, arguments)

    Promise
    .try =>
      if ps = options.proxyServer
        @_setProxy(win.webContents, ps)
    .then ->
      win.loadURL(url)
    .return(win)

  _setProxy: (webContents, proxyServer) ->
    new Promise (resolve) ->
      webContents.session.setProxy({
        proxyRules: proxyServer
      }, resolve)

  _automations: (win) ->
    cookies = Promise.promisifyAll(win.webContents.session.cookies)

    return {
      clear: (filter = {}) ->
        clear = (cookie) =>
          url = getUrl(cookie)

          cookies.removeAsync(url, cookie.name)
          .return(cookie)

        @getAll(filter)
        .map(clear)

      getAll: (filter) ->
        cookies
        .getAsync(filter)

      getCookies: (filter) ->
        @getAll(filter)

      getCookie: (filter) ->
        @getAll(filter)
        .then(firstOrNull)

      setCookie: (props = {}) ->
        ## only set the url if its not already present
        props.url ?= getUrl(props)

        ## resolve with the cookie props. the extension
        ## calls back with the cookie details but electron
        ## chrome API's do not. but it doesn't matter because
        ## we always send a fully complete cookie props object
        ## which can simply be returned.
        cookies
        .setAsync(props)
        .return(props)

      clearCookie: (filter) ->
        @clear(filter)
        .then(firstOrNull)

      clearCookies: (filter) ->
        @clear(filter)

      isAutomationConnected: ->
        true

      takeScreenshot: ->
        new Promise (resolve) ->
          win.capturePage (img) ->
            resolve(img.toDataURL())
    }

  open: (url, automation, config = {}, options = {}) ->
    @_render(url, options)
    .then (win) =>
      automations = @_automations(win)

      invoke = (method, data) =>
        automations[method](data)

      automation.use({
        onRequest: (message, data) ->
          switch message
            when "get:cookies"
              invoke("getCookies", data)
            when "get:cookie"
              invoke("getCookie", data)
            when "set:cookie"
              invoke("setCookie", data)
            when "clear:cookies"
              invoke("clearCookies", data)
            when "clear:cookie"
              invoke("clearCookie", data)
            when "is:automation:client:connected"
              invoke("isAutomationConnected", data)
            when "take:screenshot"
              invoke("takeScreenshot")
            else
              throw new Error("No automation handler registered for: '#{message}'")
      })

      call = (method) ->
        return ->
          if not win.isDestroyed()
            win[method]()

      return {
        browserWindow:      win
        kill:               call("close")
        removeAllListeners: call("removeAllListeners")
      }
}
