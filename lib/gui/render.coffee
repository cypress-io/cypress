_             = require("lodash")
path          = require("path")
app           = require("electron").app
ipc           = require("electron").ipcMain
BrowserWindow = require("electron").BrowserWindow
cache         = require("../cache")
CypressGui    = require("cypress-gui")

## Keep a global reference of the window object, if you don't, the window will
## be closed automatically when the JavaScript object is garbage collected.
mainWindow = null

getUrl = (type) ->
  switch type
    when "GITHUB_LOGIN"
      "https://www.google.com"
    else
      throw new Error("No acceptable window type found for: '#{arg.type}'")

module.exports = (optionsOrArgv) ->
  ## if we've been passed an array of argv
  ## this means we are in development
  ## mode and need to parse the args again
  if _.isArray(optionsOrArgv)
    if not cyArgs = process.env.CYPRESS_ARGS
      throw new Error("No env vars found for: 'CYPRESS_ARGS'")

    ## parse the cypress args
    options = JSON.parse(cyArgs)
  else
    options = optionsOrArgv

  ipc.on "request", (event, id, type, arg) ->
    send = (err, data) ->
      event.sender.send("response", {id: id, __error: err, data: data})

    switch type
      when "window:open"
        args = _.defaults {}, arg, {
          url: getUrl(arg.type)
          width:  600
          height: 500
          show:   true
          webPreferences: {
            nodeIntegration: false
          }
        }

        url = getUrl(arg.type)

        win = new BrowserWindow(args)
        win.loadURL(args.url)

        ## open dev tools if they're true
        if args.devTools
          win.webContents.openDevTools()

        win.once "dom-ready", ->
          send(null, null)

      when "get:options"
        ## return options
        send(null, options)

      when "update"
        send(null, {foo: "bar"})

      when "get:current:user"
        cache.getUser()
          .then (user) ->
            send(null, user)
          .catch(send)

      else
        throw new Error("No ipc event registered for: '#{type}'")

  options.url = CypressGui.getPathToHtml()# "file://#{__dirname}/../app/public/index.html"

  console.log options

  ## Quit when all windows are closed.
  app.on "window-all-closed", ->
    ipc.removeAllListeners()

    app.quit()

  ## This method will be called when Electron has finished
  ## initialization and is ready to create browser windows.
  app.on "ready", ->
    ## Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1280
      height: 720
      ## "type": "toolbar"
      show: true
      preload: path.join(__dirname, "./ipc.js")
      webPreferences: {
        nodeIntegration: false
      #   pageVisibility: true
      #   allowDisplayingInsecureContent: true
      #   allowRunningInsecureContent: true
      }
    })

    ## and load the index.html of the app.
    mainWindow.loadURL(options.url)

    ## Open the DevTools conditionally
    # if options.devTools
    mainWindow.webContents.openDevTools()

    ## Emitted when the window is closed.
    mainWindow.on "closed", ->
      ## Dereference the window object, usually you would store windows
      ## in an array if your app supports multi windows, this is the time
      ## when you should delete the corresponding element.
      mainWindow = null
