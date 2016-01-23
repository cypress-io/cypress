_             = require("lodash")
path          = require("path")
uri           = require("url")
cypressGui    = require("cypress-gui")
BrowserWindow = require("electron").BrowserWindow
session       = require("../../session")

windows = {}

getUrl = (type) ->
  switch type
    when "GITHUB_LOGIN"
      session.getLoginUrl()
    when "ABOUT"
      cypressGui.getPathToAbout()
    when "DEBUG"
      cypressGui.getPathToDebug()
    when "UPDATES"
      cypressGui.getPathToUpdates()
    when "INDEX"
      cypressGui.getPathToIndex()
    else
      throw new Error("No acceptable window type found for: '#{arg.type}'")

module.exports = {
  reset: ->
    windows = {}

  _getByType: (type) ->
    windows[type]

  get: (type) ->
    @_getByType(type) ? throw new Error("No window exists for: '#{type}'")

  getByWebContents: (webContents) ->
    _.find windows, (win) ->
      win.webContents is webContents

  create: (options = {}) ->
    ## if we already have a window open based
    ## on that type then just show + focus it!
    if win = @_getByType(options.type)
      win.show()
      return Promise.resolve()

    args = _.defaults {}, options, {
      url: getUrl(options.type)
      width:  600
      height: 500
      show:   true
      focus:  true
      preload: path.join(__dirname, "./ipc.js")
      webPreferences: {
        nodeIntegration: false
        # pageVisibility:  true
      }
    }

    urlChanged = (url, resolve) ->
      parsed = uri.parse(url, true)

      if code = parsed.query.code
        win.destroy()

        resolve(code)

    win = new BrowserWindow(args)

    windows[options.type] = win

    win.webContents.id = _.uniqueId("webContents")

    win.on "closed", ->
      ## slice the window out of windows reference
      windows = _.omit windows, _.identity(win)

    ## open dev tools if they're true
    if args.devTools
      win.webContents.openDevTools()

    ## enable our url to be a promise
    ## and wait for this to be resolved
    Promise
      .resolve(args.url)
      .then (url) ->
        ## navigate the window here!
        win.loadURL(url)

        if args.type is "GITHUB_LOGIN"
          new Promise (resolve, reject) ->
            win.webContents.on "will-navigate", (e, url) ->
              urlChanged(url, resolve)

            win.webContents.on "did-get-redirect-request", (e, oldUrl, newUrl) ->
              urlChanged(newUrl, resolve)
        else
          Promise.resolve()

}