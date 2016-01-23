_           = require("lodash")
ipc         = require("electron").ipcMain
shell       = require("electron").shell
user        = require("./user")
dialog      = require("./dialog")
project     = require("./project")
pgk         = require("./package")
cloneError  = require("./clone_error")
Renderer    = require("./renderer")
logger      = require("../../log")
Updater     = require("../../updater")

handleEvent = (event, id, type, arg, options) ->
  sendResponse = (data = {}) ->
    try
      event.sender.send("response", data)

  sendErr = (err) ->
    sendResponse({id: id, __error: cloneError(err)})

  send = (data) ->
    sendResponse({id: id, data: data})

  switch type
    when "show:directory:dialog"
      dialog.show()
      .then(send)
      .catch(sendErr)

    when "log:in"
      user.logIn(arg)
      .then(send)
      .catch(sendErr)

    when "log:out"
      user.logOut(arg)
      .then(send)
      .catch(sendErr)

    when "get:current:user"
      user.get()
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
      send(null)

    when "updater:install"
      ## send up the appPath, execPath, and initial args
      Updater.install(arg.appPath, arg.execPath, options)

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

      win = Renderer.getByWebContents(event.sender)
      win.once "closed", ->
        upd.cancel()

    when "update"
      send({foo: "bar"})

    when "get:logs"
      logger.getLogs()
      .then(send)
      .catch(sendErr)

    when "on:log"
      logger.onLog = send

    when "off:log"
      logger.off()
      send(null)

    when "clear:logs"
      logger.clearLogs()
      .then -> send(null)

    when "get:project:paths"
      project.paths()
      .then(send)
      .catch(sendErr)

    when "remove:project"
      project.remove(arg)
      .then -> send(arg)
      .catch(sendErr)

    when "add:project"
      project.add(arg)
      .then -> send(arg)
      .catch(sendErr)

    when "open:project"
      project.open(arg.path, arg.options)
      .then(send)
      .catch(sendErr)

    when "close:project"
      project.close()
      .then(send)
      .catch(sendErr)

    else
      throw new Error("No ipc event registered for: '#{type}'")

module.exports = {
  stop: ->
    ipc.removeAllListeners()

  start: (options) ->
    ## curry right options
    ipc.on "request", _.partialRight(handleEvent, options)

}