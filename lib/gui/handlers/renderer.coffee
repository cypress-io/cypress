_             = require("lodash")
path          = require("path")
uri           = require("url")
cyDesktop     = require("@cypress/core-desktop-gui")
BrowserWindow = require("electron").BrowserWindow
cwd           = require("../../cwd")
user          = require("../../user")
Electron      = require("../../browsers/electron")
savedState    = require("../../saved_state")

windows               = {}
recentlyCreatedWindow = false

getUrl = (type) ->
  switch type
    when "GITHUB_LOGIN"
      user.getLoginUrl()
    when "ABOUT"
      cyDesktop.getPathToAbout()
    when "DEBUG"
      cyDesktop.getPathToDebug()
    when "UPDATES"
      cyDesktop.getPathToUpdates()
    when "INDEX"
      cyDesktop.getPathToIndex()
    else
      throw new Error("No acceptable window type found for: '#{type}'")

getByType = (type) ->
  windows[type]

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

  getAutomation: (win) ->
    win.automation ?= Electron.automation(win)

  hideAllUnlessAnotherWindowIsFocused: ->
    ## bail if we have another focused window
    ## or we are in the middle of creating a new one
    return if BrowserWindow.getFocusedWindow() or recentlyCreatedWindow

    ## else hide all windows
    _.invoke windows, "hide"

  getByWebContents: (webContents) ->
    _.find windows, (win) ->
      win.webContents is webContents

  create: (options = {}) ->
    ## if we already have a window open based
    ## on that type then just show + focus it!
    if win = getByType(options.type)
      win.show()

      if options.type is "GITHUB_LOGIN"
        err = new Error
        err.alreadyOpen = true
        return Promise.reject(err)
      else
        return Promise.resolve(win)

    recentlyCreatedWindow = true

    _.defaults options,
      onFocus: ->
      onBlur: ->
      onClose: ->

    args = _.defaults {}, options, {
      width:  600
      height: 500
      show:   true
      webPreferences: {
        nodeIntegration: false
        backgroundThrottling: false
      }
    }

    ## PROJECT windows are the runner or descendants of the
    ## runner, so they don't need ipc
    if not /^PROJECT/.test(options.type)
      args.webPreferences.preload = cwd("lib", "ipc", "ipc.js")

    if args.show is false
      args.webPreferences.offscreen = true

    if options.chromeWebSecurity is false
      args.webPreferences.webSecurity = false

    args.url ?= getUrl(options.type)

    urlChanged = (url, resolve) ->
      parsed = uri.parse(url, true)

      if code = parsed.query.code
        ## there is a bug with electron
        ## crashing when attemping to
        ## destroy this window synchronously
        _.defer -> win.destroy()

        resolve(code)

    if args.transparent and args.show
      {width, height} = args

      args.show = false
      args.width = 0
      args.height = 0

    win = new BrowserWindow(args)

    win.on "blur", ->
      options.onBlur.apply(win, arguments)

    win.on "focus", ->
      options.onFocus.apply(win, arguments)

    windows[options.type] = win

    win.webContents.id = _.uniqueId("webContents")

    win.once "closed", ->
      win.removeAllListeners()
      options.onClose()

      ## slice the window out of windows reference
      delete windows[options.type]

    ## open dev tools if they're true
    if args.devTools
      win.webContents.openDevTools({detach: true})

    ## enable our url to be a promise
    ## and wait for this to be resolved
    Promise
      .resolve(args.url)
      .then (url) ->
        if width and height
          ## QUESTION: is this code unreachable? doesn't seem that
          ## width and height will ever be truthy
          win.webContents.once "dom-ready", ->
            win.setSize(width, height)
            win.show()

        ## navigate the window here!
        win.loadURL(url)

        ## reset this back to false
        recentlyCreatedWindow = false

        if args.type is "GITHUB_LOGIN"
          new Promise (resolve, reject) ->
            win.webContents.on "will-navigate", (e, url) ->
              urlChanged(url, resolve)

            win.webContents.on "did-get-redirect-request", (e, oldUrl, newUrl) ->
              urlChanged(newUrl, resolve)
        else
          Promise.resolve(win)

  trackState: (win, state, keys) ->
    win.on "resize", _.debounce ->
      [width, height] = win.getSize()
      [x, y] = win.getPosition()
      newState = {}
      newState[keys.width] = width
      newState[keys.height] = height
      newState[keys.x] = x
      newState[keys.y] = y
      savedState.set(newState)
    , 500

    win.on "moved", _.debounce ->
      [x, y] = win.getPosition()
      newState = {}
      newState[keys.x] = x
      newState[keys.y] = y
      savedState.set(newState)
    , 500

    if state[keys.devTools]
      win.webContents.openDevTools()

    win.webContents.on "devtools-opened", ->
      newState = {}
      newState[keys.devTools] = true
      savedState.set(newState)

    win.webContents.on "devtools-closed", ->
      newState = {}
      newState[keys.devTools] = false
      savedState.set(newState)

}
