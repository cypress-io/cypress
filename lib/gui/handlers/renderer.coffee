_             = require("lodash")
path          = require("path")
BrowserWindow = require("electron").BrowserWindow
cypressGui    = require("cypress-gui")

windows = []

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
    windows = []

  get: (type) ->
    windows[type] ? throw new Error("No window exists for: '#{type}'")

  getByWebContents: (webContents) ->
    _.find windows, (win) ->
      win.webContents is webContents

  create: (options = {}) ->
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

    urlChanged = (url) ->
      parsed = uri.parse(url, true)

      if code = parsed.query.code
        win.close()

        send(null, code)

    win = new BrowserWindow(args)

    windows.push(win)

    win.webContents.id = _.uniqueId("webContents")

    win.on "closed", ->
      ## slice the window out of windows reference
      windows = _.without(windows, win)

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

        # win.once "dom-ready", ->
        #   send(null, null)

        if args.type is "GITHUB_LOGIN"
          win.webContents.on "will-navigate", (e, url) ->
            urlChanged(url)

          win.webContents.on "did-get-redirect-request", (e, oldUrl, newUrl) ->
            urlChanged(newUrl)

}