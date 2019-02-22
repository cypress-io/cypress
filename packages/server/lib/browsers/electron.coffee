_             = require("lodash")
EE            = require("events")
Promise       = require("bluebird")
debug         = require("debug")("cypress:server:browsers:electron")
menu          = require("../gui/menu")
Windows       = require("../gui/windows")
appData       = require("../util/app_data")
background    = require("../background")
savedState    = require("../saved_state")
profileCleaner = require("../util/profile_cleaner")

tryToCall = (win, method) ->
  try
    if not win.isDestroyed()
      if _.isString(method)
        win[method]()
      else
        method()
  catch err
    debug("got error calling window method:", err.stack)

module.exports = {
  _defaultOptions: (projectRoot, state, options) ->
    _this = @

    defaults = {
      x: state.browserX
      y: state.browserY
      width: state.browserWidth or 1280
      height: state.browserHeight or 720
      devTools: state.isBrowserDevToolsOpen
      minWidth: 100
      minHeight: 100
      contextMenu: true
      partition: @_getPartition(options)
      trackState: {
        width: "browserWidth"
        height: "browserHeight"
        x: "browserX"
        y: "browserY"
        devTools: "isBrowserDevToolsOpen"
      }
      onFocus: ->
        if options.show
          menu.set({withDevTools: true})
      onNewWindow: (e, url) ->
        _win = @

        _this._launchChild(e, url, _win, projectRoot, state, options)
        .then (child) ->
          ## close child on parent close
          _win.on "close", ->
            if not child.isDestroyed()
              child.close()
    }

    _.defaultsDeep({}, options, defaults)

  _render: (url, projectRoot, options = {}) ->
    win = Windows.create(projectRoot, options)

    @_launch(win, url, options)

  _launchChild: (e, url, parent, projectRoot, state, options) ->
    e.preventDefault()

    [parentX, parentY] = parent.getPosition()

    options = @_defaultOptions(projectRoot, state, options)

    _.extend(options, {
      x: parentX + 100
      y: parentY + 100
      trackState: false
      onPaint: null ## dont capture paint events
    })

    win = Windows.create(projectRoot, options)

    ## needed by electron since we prevented default and are creating
    ## our own BrowserWindow (https://electron.atom.io/docs/api/web-contents/#event-new-window)
    e.newGuest = win

    @_launch(win, url, options)

  _launch: (win, url, options) ->
    if options.show
      menu.set({withDevTools: true})

    Promise
    .try =>
      if options.show is false
        @_attachDebugger(win.webContents)

      if ua = options.userAgent
        @_setUserAgent(win.webContents, ua)

      setProxy = =>
        if ps = options.proxyServer
          @_setProxy(win.webContents, ps)

      Promise.join(
        setProxy(),
        @_clearCache(win.webContents)
      )
    .then ->
      win.loadURL(url)
    .return(win)

  _attachDebugger: (webContents) ->
    try
      webContents.debugger.attach()
      debug("debugger attached")
    catch err
      debug("debugger attached failed %o", { err })

    webContents.debugger.on "detach", (event, reason) ->
      debug("debugger detached due to %o", { reason })

    webContents.debugger.on "message", (event, method, params) ->
      if method is "Console.messageAdded"
        debug("console message: %o", params.message)

    webContents.debugger.sendCommand("Console.enable")

  _getPartition: (options) ->
    if options.isTextTerminal
      ## create dynamic persisted run
      ## to enable parallelization
      return "persist:run-#{process.pid}"

    ## we're in interactive mode and always
    ## use the same session
    return "persist:interactive"

  _clearCache: (webContents) ->
    debug("clearing cache")
    new Promise (resolve) ->
      webContents.session.clearCache(resolve)

  _setUserAgent: (webContents, userAgent) ->
    debug("setting user agent to:", userAgent)
    ## set both because why not
    webContents.setUserAgent(userAgent)
    webContents.session.setUserAgent(userAgent)

  _setProxy: (webContents, proxyServer) ->
    new Promise (resolve) ->
      webContents.session.setProxy({
        proxyRules: proxyServer
        ## this should really only be necessary when 
        ## running Chromium versions >= 72
        ## https://github.com/cypress-io/cypress/issues/1872
        proxyBypassRules: "<-loopback>"
      }, resolve)

  open: (browser, url, options = {}, automation) ->
    { projectRoot, isTextTerminal } = options

    debug("open %o", { browser, url })

    savedState(projectRoot, isTextTerminal)
    .then (state) ->
      state.get()
    .then (state) =>
      debug("received saved state %o", state)

      ## get our electron default options
      options = @_defaultOptions(projectRoot, state, options)

      ## get the GUI window defaults now
      options = Windows.defaults(options)

      debug("browser window options %o", _.omitBy(options, _.isFunction))

      Promise
      .try =>
        ## bail if we're not registered to this event
        return options if not background.isRegistered("browser:launch")

        background.execute("browser:launch", options.browser, options)
        .then (newOptions) ->
          if newOptions
            debug("received new options from background event %o", newOptions)
            _.extend(options, newOptions)

          return options
    .then (options) =>
      debug("launching browser window to url: %s", url)

      @_render(url, projectRoot, options)
      .then (win) =>
        ## cause the webview to receive focus so that
        ## native browser focus + blur events fire correctly
        ## https://github.com/cypress-io/cypress/issues/1939
        tryToCall(win, "focusOnWebView")

        a = Windows.automation(win)

        invoke = (method, data) =>
          tryToCall win, ->
            a[method](data)

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

        events = new EE

        win.once "closed", ->
          debug("closed event fired")

          events.emit("exit")

        return _.extend events, {
          browserWindow:      win
          kill:               -> tryToCall(win, "close")
          removeAllListeners: -> tryToCall(win, "removeAllListeners")
        }
}
