_             = require("lodash")
path          = require("path")
app           = require("electron").app
ipc           = require("electron").ipcMain
BrowserWindow = require("electron").BrowserWindow

## Keep a global reference of the window object, if you don't, the window will
## be closed automatically when the JavaScript object is garbage collected.
mainWindow = null

module.exports = (argv) ->
  ipc.on "request", (event, id, type, arg) ->
    send = (err, data) ->
      event.sender.send("response", {id: id, __error: err, data: data})

    switch type
      ## return argv (or options here?)
      when "argv"
        send(null, argv)
      when "update"
        send(null, {foo: "bar"})
      else
        throw new Error("No ipc event registered for: '#{type}'")

  options = {}

  options.url = "file://#{__dirname}/../app/public/index.html"

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
