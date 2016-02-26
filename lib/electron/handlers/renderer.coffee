_             = require("lodash")
path          = require("path")
uri           = require("url")
cypressGui    = require("cypress-gui")
BrowserWindow = require("electron").BrowserWindow
user          = require("../../user")

windows               = {}
recentlyCreatedWindow = false

getUrl = (type) ->
  switch type
    when "GITHUB_LOGIN"
      user.getLoginUrl()
    when "ABOUT"
      cypressGui.getPathToAbout()
    when "DEBUG"
      cypressGui.getPathToDebug()
    when "UPDATES"
      cypressGui.getPathToUpdates()
    when "INDEX"
      cypressGui.getPathToIndex()
    else
      throw new Error("No acceptable window type found for: '#{type}'")

getByType = (type) ->
  windows[type]

module.exports = {
  reset: ->
    windows = {}

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

    args = _.defaults {}, options, {
      width:  600
      height: 500
      show:   true
      preload: path.join(__dirname, "./ipc.js")
      webPreferences: {
        nodeIntegration: false
      }
    }

    args.url ?= getUrl(options.type)

    urlChanged = (url, resolve) ->
      parsed = uri.parse(url, true)

      if code = parsed.query.code
        ## there is a bug with electron
        ## crashing when attemping to
        ## destroy this window synchronously
        _.defer -> win.destroy()

        resolve(code)

    win = new BrowserWindow(args)

    win.on "blur", ->
      options.onBlur.apply(win, arguments)

    win.on "focus", ->
      options.onFocus.apply(win, arguments)

    windows[options.type] = win

    win.webContents.id = _.uniqueId("webContents")

    win.once "closed", ->
      win.removeAllListeners()

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

}