_             = require("lodash")
EE            = require("events")
Promise       = require("bluebird")
debug         = require("debug")("cypress:server:browsers:electron")
plugins       = require("../plugins")
menu          = require("../gui/menu")
Windows       = require("../gui/windows")
savedState    = require("../saved_state")

module.exports = {
  _defaultOptions: (projectPath, state, options) ->
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
      trackState: {
        width: "browserWidth"
        height: "browserHeight"
        x: "browserX"
        y: "browserY"
        devTools: "isBrowserDevToolsOpen"
      }
      onFocus: ->
        menu.set({withDevTools: true})
      onNewWindow: (e, url) ->
        _win = @

        _this._launchChild(e, url, _win, projectPath, state, options)
        .then (child) ->
          ## close child on parent close
          _win.on "close", ->
            if not child.isDestroyed()
              child.close()
    }

    _.defaultsDeep({}, options, defaults)

  _render: (url, projectPath, options = {}) ->
    win = Windows.create(projectPath, options)

    @_launch(win, url, options)

  _launchChild: (e, url, parent, projectPath, state, options) ->
    e.preventDefault()

    [parentX, parentY] = parent.getPosition()

    options = @_defaultOptions(projectPath, state, options)

    _.extend(options, {
      x: parentX + 100
      y: parentY + 100
      trackState: false
      onPaint: null ## dont capture paint events
    })

    win = Windows.create(projectPath, options)

    ## needed by electron since we prevented default and are creating
    ## our own BrowserWindow (https://electron.atom.io/docs/api/web-contents/#event-new-window)
    e.newGuest = win

    @_launch(win, url, options)

  _launch: (win, url, options) ->
    menu.set({withDevTools: true})

    debug("launching browser window to url %s with options %o", url, options)

    Promise
    .try =>
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

  _clearCache: (webContents) ->
    new Promise (resolve) ->
      webContents.session.clearCache(resolve)

  _setUserAgent: (webContents, userAgent) ->
    ## set both because why not
    webContents.setUserAgent(userAgent)
    webContents.session.setUserAgent(userAgent)

  _setProxy: (webContents, proxyServer) ->
    new Promise (resolve) ->
      webContents.session.setProxy({
        proxyRules: proxyServer
      }, resolve)

  open: (browserName, url, options = {}, automation) ->
    { projectPath } = options

    savedState(projectPath)
    .then (state) ->
      state.get()
    .then (state) =>
      ## get our electron default options
      options = @_defaultOptions(projectPath, state, options)

      ## get the GUI window defaults now
      options = Windows.defaults(options)

      Promise
      .try =>
        ## bail if we're not registered to this event
        return options if not plugins.has("before:browser:launch")

        plugins.execute("before:browser:launch", options.browser, options)
        .then (newOptions) ->
          return newOptions ? options
    .then (options) =>
      @_render(url, projectPath, options)
      .then (win) =>
        a = Windows.automation(win)

        invoke = (method, data) =>
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

        call = (method) ->
          return ->
            if not win.isDestroyed()
              win[method]()

        events = new EE

        win.once "closed", ->
          debug("closed event fired")

          call("removeAllListeners")
          events.emit("exit")

        return _.extend events, {
          browserWindow:      win
          kill:               call("close")
          removeAllListeners: call("removeAllListeners")
        }
}
