_             = require("lodash")
uri           = require("url")
Promise       = require("bluebird")
cyDesktop     = require("@packages/desktop-gui")
extension     = require("@packages/extension")
contextMenu   = require("electron-context-menu")
BrowserWindow = require("electron").BrowserWindow
debug         = require("debug")("cypress:server:windows")
cwd           = require("../cwd")
user          = require("../user")
savedState    = require("../saved_state")

windows               = {}
recentlyCreatedWindow = false

getUrl = (type) ->
  switch type
    when "INDEX"
      cyDesktop.getPathToIndex()
    else
      throw new Error("No acceptable window type found for: '#{type}'")

getByType = (type) ->
  windows[type]

getCookieUrl = (props) ->
  extension.getCookieUrl(props)

firstOrNull = (cookies) ->
  ## normalize into null when empty array
  cookies[0] ? null

setWindowProxy = (win) ->
  if not process.env.HTTP_PROXY
    return

  win.webContents.session.setProxy({
    proxyRules: process.env.HTTP_PROXY
    proxyBypassRules: process.env.NO_PROXY
  })

module.exports = {
  reset: ->
    windows = {}

  destroy: (type) ->
    if type and (win = getByType(type))
      win.destroy()

  get: (type) ->
    getByType(type) ? throw new Error("No window exists for: '#{type}'")

  showAll: ->
    _.invoke windows, "showInactive"

  hideAllUnlessAnotherWindowIsFocused: ->
    ## bail if we have another focused window
    ## or we are in the middle of creating a new one
    return if BrowserWindow.getFocusedWindow() or recentlyCreatedWindow

    ## else hide all windows
    _.invoke windows, "hide"

  focusMainWindow: ->
    getByType('INDEX').show()

  getByWebContents: (webContents) ->
    BrowserWindow.fromWebContents(webContents)

  getBrowserAutomation: (webContents) ->
    win = @getByWebContents(webContents)

    @automation(win)

  _newBrowserWindow: (options) ->
    new BrowserWindow(options)

  automation: (win) ->
    cookies = Promise.promisifyAll(win.webContents.session.cookies)

    return {
      clear: (filter = {}) ->
        clear = (cookie) =>
          url = getCookieUrl(cookie)

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
        props.url ?= getCookieUrl(props)

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

  defaults: (options = {}) ->
    _.defaultsDeep(options, {
      x:               null
      y:               null
      show:            true
      frame:           true
      width:           null
      height:          null
      minWidth:        null
      minHeight:       null
      devTools:        false
      trackState:      false
      contextMenu:     false
      recordFrameRate: null
      # extension:       null ## TODO add these once we update electron
      # devToolsExtension: null ## since these API's were added in 1.7.6
      onPaint:         null
      onFocus: ->
      onBlur: ->
      onClose: ->
      onCrashed: ->
      onNewWindow: ->
      webPreferences:  {
        partition:            null
        chromeWebSecurity:    true
        nodeIntegration:      false
        backgroundThrottling: false
      }
    })

  create: (projectRoot, options = {}) ->
    options = @defaults(options)

    if options.show is false
      options.frame = false
      options.webPreferences.offscreen = true

    if options.chromeWebSecurity is false
      options.webPreferences.webSecurity = false

    if options.partition
      options.webPreferences.partition = options.partition

    win = @_newBrowserWindow(options)

    win.on "blur", ->
      options.onBlur.apply(win, arguments)

    win.on "focus", ->
      options.onFocus.apply(win, arguments)

    win.once "closed", ->
      win.removeAllListeners()
      options.onClose.apply(win, arguments)

    ## the webview loses focus on navigation, so we
    ## have to refocus it everytime top navigates in headless mode
    ## https://github.com/cypress-io/cypress/issues/2190
    if options.show is false
      win.webContents.on "did-start-loading", ->
        if not win.isDestroyed()
          win.focusOnWebView()

    win.webContents.on "crashed", ->
      options.onCrashed.apply(win, arguments)

    win.webContents.on "new-window", ->
      options.onNewWindow.apply(win, arguments)

    if ts = options.trackState
      @trackState(projectRoot, options.isTextTerminal, win, ts)

    ## open dev tools if they're true
    if options.devTools
      ## and possibly detach dev tools if true
      win.webContents.openDevTools()

    if options.contextMenu
      ## adds context menu with copy, paste, inspect element, etc
      contextMenu({
        showInspectElement: true
        window: win
      })

    if options.onPaint
      setFrameRate = (num) ->
        if win.webContents.getFrameRate() isnt num
          win.webContents.setFrameRate(num)

      win.webContents.on "paint", (event, dirty, image) ->
        ## https://github.com/cypress-io/cypress/issues/705
        ## if win is destroyed this will throw
        try
          if fr = options.recordFrameRate
            setFrameRate(fr)

          options.onPaint.apply(win, arguments)
        catch err
          ## do nothing

    win

  open: (projectRoot, options = {}) ->
    ## if we already have a window open based
    ## on that type then just show + focus it!
    if win = getByType(options.type)
      win.show()

      return Promise.resolve(win)

    recentlyCreatedWindow = true

    _.defaults(options, {
      width:  600
      height: 500
      show:   true
      webPreferences: {
        preload: cwd("lib", "ipc", "ipc.js")
      }
    })

    if not options.url
      options.url = getUrl(options.type)

    win = @create(projectRoot, options)

    debug("creating electron window with options %o", options)

    windows[options.type] = win

    win.webContents.id = _.uniqueId("webContents")

    win.once "closed", ->
      ## slice the window out of windows reference
      delete windows[options.type]

    ## enable our url to be a promise
    ## and wait for this to be resolved
    Promise.join(
      options.url,
      setWindowProxy(win)
    )
    .spread (url) ->
      ## navigate the window here!
      win.loadURL(url)

      ## reset this back to false
      recentlyCreatedWindow = false
    .thenReturn(win)

  trackState: (projectRoot, isTextTerminal, win, keys) ->
    isDestroyed = ->
      win.isDestroyed()

    win.on "resize", _.debounce ->
      return if isDestroyed()

      [width, height] = win.getSize()
      [x, y] = win.getPosition()
      newState = {}
      newState[keys.width] = width
      newState[keys.height] = height
      newState[keys.x] = x
      newState[keys.y] = y
      savedState(projectRoot, isTextTerminal)
      .then (state) ->
        state.set(newState)
    , 500

    win.on "moved", _.debounce ->
      return if isDestroyed()

      [x, y] = win.getPosition()
      newState = {}
      newState[keys.x] = x
      newState[keys.y] = y
      savedState(projectRoot, isTextTerminal)
      .then (state) ->
        state.set(newState)
    , 500

    win.webContents.on "devtools-opened", ->
      newState = {}
      newState[keys.devTools] = true
      savedState(projectRoot, isTextTerminal)
      .then (state) ->
        state.set(newState)

    win.webContents.on "devtools-closed", ->
      newState = {}
      newState[keys.devTools] = false
      savedState(projectRoot, isTextTerminal)
      .then (state) ->
        state.set(newState)

}
