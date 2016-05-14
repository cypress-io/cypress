_           = require("lodash")
ipc         = require("electron").ipcMain
shell       = require("electron").shell
cyIcons     = require("@cypress/core-icons")
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
    callback("onError", err)
    sendResponse({id: id, __error: errors.clone(err)})

  send = (data) ->
    sendResponse({id: id, data: data})

  callback = (key, args...) ->
    fn = options[key]
    if _.isFunction(fn)
      fn.apply(null, args)

  switch type
    when "quit"
      callback("onQuit")

    when "gui:error"
      logs.error(arg)
      .then -> send(null)
      .catch(sendErr)

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

    when "launch:browser"
      # headless.createRenderer(arg, true)
      project.launch(arg, {
        onBrowserOpen: ->
          send({browserOpened: true})
        onBrowserClose: ->
          send({browserClosed: true})
      })
      .catch(sendErr)

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
      send(cyIcons.getPathToIcon("icon_32x32@2x.png"))

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
      project.open(arg, options)
      .call("getConfig")
      .then(send)
      .then ->
        callback("onOpenProject")
      .catch (err) ->
        sendErr(err)

    when "close:project"
      project.close()
      .then(send)
      .then ->
        callback("onCloseProject")
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