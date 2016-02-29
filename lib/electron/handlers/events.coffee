_           = require("lodash")
ipc         = require("electron").ipcMain
shell       = require("electron").shell
cypressIcons = require("cypress-icons")
dialog      = require("./dialog")
project     = require("./project")
pgk         = require("./package")
cookies     = require("./cookies")
logs        = require("./logs")
Renderer    = require("./renderer")
user        = require("../../user")
errors      = require("../../errors")
Updater     = require("../../updater")
Project     = require("../../project")

handleEvent = (options, event, id, type, arg) ->
  sendResponse = (data = {}) ->
    try
      event.sender.send("response", data)

  sendErr = (err) ->
    sendResponse({id: id, __error: errors.clone(err)})

  send = (data) ->
    sendResponse({id: id, data: data})

  switch type
    when "quit"
      ## TODO: fix this. if the debug window
      ## is open and we attempt to quit
      ## it will not be closed because
      ## there is a memory reference
      ## thus we have to remove it first
      logs.off()

      ## exit the app immediately
      options.app.exit(0)

    when "show:directory:dialog"
      dialog.show()
      .then(send)
      .catch(sendErr)

    when "log:in"
      user.logIn(arg)
      .then(send)
      .catch(sendErr)

    when "log:out"
      user.logOut()
      .then(send)
      .catch(sendErr)

    when "get:current:user"
      user.get()
      .then(send)
      .catch(sendErr)

    when "clear:github:cookies"
      cookies.clearGithub(event.sender.session.cookies)
      .then(send)
      .catch(sendErr)

    when "external:open"
      shell.openExternal(arg)

    when "window:open"
      Renderer.create(arg)
      .then(send)
      .catch(sendErr)

    when "window:close"
      Renderer.getByWebContents(event.sender).destroy()

    when "get:options"
      pgk(options)
      .then(send)
      .catch(sendErr)

    when "change:coords"
      coords = _.mapValues(arg, parseFloat)
      win = Renderer.getByWebContents(event.sender)
      win.setPosition(coords.x, coords.y)

    when "updater:install"
      ## send up the appPath, execPath, and initial args
      Updater.install(arg.appPath, arg.execPath, options)
      send(null)

    when "updater:check"
      Updater.check({
        onNewVersion: ->   send(true)
        onNoNewVersion: -> send(false)
      })

    when "updater:run"
      echo = (event, version) ->
        send({event: event, version: version})

      upd = Updater.run({
        onStart: -> echo("start")
        onApply: -> echo("apply")
        onError: -> echo("error")
        onDone: ->  echo("done")
        onNone: ->  echo("none")
        onDownload: (version) ->
          echo("download", version)
      })

      ## TODO: there is no note here, what if the window
      ## is closed once the updater finishes?
      win = Renderer.getByWebContents(event.sender)
      win.once "closed", ->
        upd.cancel()

    when "get:about:logo:src"
      send(cypressIcons.getPathToIcon("icon_32x32@2x.png"))

    when "get:logs"
      logs.get()
      .then(send)
      .catch(sendErr)

    when "clear:logs"
      logs.clear()
      .then -> send(null)
      .catch(sendErr)

    when "on:log"
      logs.onLog(send)

    when "off:log"
      logs.off()
      send(null)

    when "get:project:paths"
      Project.paths()
      .then(send)
      .catch(sendErr)

    when "add:project"
      Project.add(arg)
      .then -> send(arg)
      .catch(sendErr)

    when "remove:project"
      Project.remove(arg)
      .then -> send(arg)
      .catch(sendErr)

    when "open:project"
      project.open(arg, {
        changeEvents: true
      })
      .call("getConfig")
      .then(send)
      .catch(sendErr)

    when "close:project"
      project.close()
      .then(send)
      .catch(sendErr)

    when "on:project:settings:change"
      project.onSettingsChanged()
      .then -> send(null)
      .catch(sendErr)

    else
      throw new Error("No ipc event registered for: '#{type}'")

module.exports = {
  handleEvent: handleEvent

  stop: ->
    ipc.removeAllListeners()

  start: (options) ->
    ## curry left options
    ipc.on "request", _.partial(@handleEvent, options)

}