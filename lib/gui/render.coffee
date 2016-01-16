_             = require("lodash")
uri           = require("url")
path          = require("path")
app           = require("electron").app
ipc           = require("electron").ipcMain
shell         = require("electron").shell
dialog        = require("electron").dialog
BrowserWindow = require("electron").BrowserWindow
cache         = require("../cache")
auth          = require("../authentication")
Cypress       = require("../cypress")
cypressGui    = require("cypress-gui")

## Keep a global reference of the window object, if you don't, the window will
## be closed automatically when the JavaScript object is garbage collected.
mainWindow = null

## global reference to any open projects
openProject = null

getUrl = (type) ->
  switch type
    when "GITHUB_LOGIN"
      auth.getLoginUrl()
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
    cloneErr = (err) ->
      ## pull off these properties
      obj = _.pick(err, "message", "type", "name", "stack", "fileName", "lineNumber", "columnNumber")

      ## and any own (custom) properties
      ## of the err object
      for own prop, val of err
        obj[prop] = val

      obj

    sendErr = (err) ->
      event.sender.send("response", {id: id, __error: cloneErr(err)})

    send = (err, data) ->
      event.sender.send("response", {id: id, __error: err, data: data})

    switch type
      when "show:directory:dialog"
        ## associate this dialog to the mainWindow
        ## so the user never loses track of which
        ## window the dialog belongs to. in other words
        ## if they blur off, they only need to focus back
        ## on the Cypress app for this dialog to appear again
        ## https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/Sheets/Concepts/AboutSheets.html

        props = {
          ## we only want the user to select a single
          ## directory. not multiple, and not files
          properties: ["openDirectory"]
        }

        dialog.showOpenDialog mainWindow, props, (paths = []) ->
          ## return the first path since there can only ever
          ## be a single directory selection
          send(null, paths[0])

      when "log:in"
        auth.logIn(arg)
        .then (user) ->
          cache.setUser(user)
          .then ->
            ## TODO: what does cache
            ## setUser return us?
            send(null, user)
        .catch(sendErr)

      when "log:out"
        auth.logOut(arg)
        .then(cache.removeUserSession())
        ## TODO: clear cookies here

      when "external:open"
        shell.openExternal(arg)

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

        urlChanged = (url) ->
          parsed = uri.parse(url, true)

          if code = parsed.query.code
            win.close()

            send(null, code)

        win = new BrowserWindow(args)

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

          .catch(sendErr)

      when "get:options"
        ## return options
        send(null, options)

      when "update"
        send(null, {foo: "bar"})

      when "get:current:user"
        cache.getUser()
        .then (user) ->
          send(null, user)
        .catch(sendErr)

      when "get:project:paths"
        cache.getProjectPaths()
        .then (paths) ->
          send(null, paths)
        .catch(sendErr)

      when "remove:project"
        cache.removeProject(arg)
        .then ->
          send(null, arg)
        .catch(sendErr)

      when "add:project"
        cache.addProject(arg)
        .then ->
          send(null, arg)
        .catch(sendErr)

      when "open:project"
        ## store the currently open project
        openProject = Cypress(arg.path)

        openProject
        .boot(arg.options)
        .get("settings")
        .then (settings) ->
          send(null, settings)
        .catch(sendErr)

      when "close:project"
        ret = ->
          ## null this back out
          openProject = null

          send(null, null)

        return ret() if not openProject

        openProject.close()
        .then(ret)

      else
        throw new Error("No ipc event registered for: '#{type}'")

  options.url = cypressGui.getPathToHtml()# "file://#{__dirname}/../app/public/index.html"

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
