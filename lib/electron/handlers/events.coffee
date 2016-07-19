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
open        = require("../../util/open")
user        = require("../../user")
logger      = require("../../logger")
errors      = require("../../errors")
Updater     = require("../../updater")
Project     = require("../../project")

handleEvent = (options, event, id, type, arg) ->
  sendResponse = (data = {}) ->
    try
      logger.info("sending ipc data", type: type, data: data)
      event.sender.send("response", data)

  sendErr = (err) ->
    sendResponse({id: id, __error: errors.clone(err)})

  send = (data) ->
    sendResponse({id: id, data: data})

  switch type
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

    when "on:launch:browser"
      project.onRelaunch(send)

    when "close:browser"
      project.closeBrowser()
      .then(send)
      .catch(sendErr)

    when "launch:browser"
      # headless.createRenderer(arg, true)
      project.launch(arg.browser, arg.url, arg.spec, {
        onBrowserOpen: ->
          send({browserOpened: true})
        onBrowserClose: ->
          ## ensure the state is correct
          project.closeBrowser()

          send({browserClosed: true})
      })
      .catch(sendErr)

    when "change:browser:spec"
      project.changeToSpec(arg.spec)
      .then(send)
      .catch(sendErr)

    when "get:open:browsers"
      project.getBrowsers()
      .then(send)
      .catch(sendErr)

    when "window:open"
      Renderer.create(arg)
      .then(send)
      .catch(sendErr)

    when "window:close"
      Renderer.getByWebContents(event.sender).destroy()

    when "open:finder"
      open.opn(arg)
      .then(send)
      .catch(sendErr)

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
      getConfig = ->
        project.opened()
        .getConfig()
        .then(send)
        .catch(sendErr)

      onSettingsChanged = ->
        project.reboot()
        .then(open)

      open = ->
        project.open(arg, options, {
          onSettingsChanged: onSettingsChanged
        })
        .then(getConfig)
        .catch(sendErr)

      ## initially open!
      open()

    when "close:project"
      project.close()
      .then(send)
      .catch(sendErr)

    when "get:specs"
      project.getSpecChanges({
        onChange: send
        onError: sendErr
      })

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
