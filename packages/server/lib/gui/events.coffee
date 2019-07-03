_           = require("lodash")
ipc         = require("electron").ipcMain
shell       = require("electron").shell
debug       = require('debug')('cypress:server:events')
dialog      = require("./dialog")
pkg         = require("./package")
logs        = require("./logs")
Windows     = require("./windows")
api         = require("../api")
open        = require("../util/open")
user        = require("../user")
errors      = require("../errors")
Updater     = require("../updater")
Project     = require("../project")
openProject = require("../open_project")
ensureUrl   = require("../util/ensure-url")
chromePolicyCheck = require("../util/chrome_policy_check")
browsers    = require("../browsers")
konfig      = require("../konfig")

handleEvent = (options, bus, event, id, type, arg) ->
  debug("got request for event: %s, %o", type, arg)

  sendResponse = (data = {}) ->
    try
      debug("sending ipc data %o", {type: type, data: data})
      event.sender.send("response", data)

  sendErr = (err) ->
    debug("send error: %o", err)
    sendResponse({id: id, __error: errors.clone(err, {html: true})})

  send = (data) ->
    sendResponse({id: id, data: data})

  sendNull = ->
    send(null)

  onBus = (event) ->
    bus.removeAllListeners(event)
    bus.on(event, send)

  switch type
    when "on:menu:clicked"
      onBus("menu:item:clicked")

    when "on:app:event"
      onBus("app:events")

    when "on:focus:tests"
      onBus("focus:tests")

    when "on:spec:changed"
      onBus("spec:changed")

    when "on:config:changed"
      onBus("config:changed")

    when "on:project:error"
      onBus("project:error")

    when "on:project:warning"
      onBus("project:warning")

    when "gui:error"
      logs.error(arg)
      .then(sendNull)
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
      user.getSafely()
      .then(send)
      .catch(sendErr)

    when "clear:github:cookies"
      Windows.getBrowserAutomation(event.sender)
      .clearCookies({domain: "github.com"})
      .return(null)
      .then(send)
      .catch(sendErr)

    when "external:open"
      shell.openExternal(arg)

    when "close:browser"
      openProject.closeBrowser()
      .then(send)
      .catch(sendErr)

    when "launch:browser"
      openProject.launch(arg.browser, arg.spec, {
        projectRoot: options.projectRoot
        onBrowserOpen: ->
          send({browserOpened: true})
        onBrowserClose: ->
          send({browserClosed: true})
      })
      .catch(sendErr)

    when "window:open"
      Windows.open(options.projectRoot, arg)
      .then(send)
      .catch(sendErr)

    when "window:close"
      Windows.getByWebContents(event.sender).destroy()

    when "open:finder"
      open.opn(arg)
      .then(send)
      .catch(sendErr)

    when "get:options"
      pkg(options)
      .then(send)
      .catch(sendErr)

    when "updater:check"
      Updater.check({
        onNewVersion: ({ version }) -> send(version)
        onNoNewVersion: -> send(false)
      })

    when "get:logs"
      logs.get()
      .then(send)
      .catch(sendErr)

    when "clear:logs"
      logs.clear()
      .then(sendNull)
      .catch(sendErr)

    when "on:log"
      logs.onLog(send)

    when "off:log"
      logs.off()
      send(null)

    when "get:orgs"
      Project.getOrgs()
      .then(send)
      .catch(sendErr)

    when "get:projects"
      Project.getPathsAndIds()
      .then(send)
      .catch(sendErr)

    when "get:project:statuses"
      Project.getProjectStatuses(arg)
      .then(send)
      .catch(sendErr)

    when "get:project:status"
      Project.getProjectStatus(arg)
      .then(send)
      .catch(sendErr)

    when "add:project"
      Project.add(arg)
      .then(send)
      .catch(sendErr)

    when "remove:project"
      Project.remove(arg)
      .then -> send(arg)
      .catch(sendErr)

    when "open:project"
      onSettingsChanged = ->
        bus.emit("config:changed")

      onSpecChanged = (spec) ->
        bus.emit("spec:changed", spec)

      onFocusTests = ->
        if _.isFunction(options.onFocusTests)
          options.onFocusTests()
        bus.emit("focus:tests")

      onError = (err) ->
        bus.emit("project:error", errors.clone(err, {html: true}))

      onWarning = (warning) ->
        bus.emit("project:warning", errors.clone(warning, {html: true}))

      browsers.getAllBrowsersWith(options.browser)
      .then (browsers = []) ->
        options.config = _.assign(options.config, { browsers })
      .then ->
        chromePolicyCheck.run (err) ->
          options.config.browsers.forEach (browser) ->
            if browser.family == 'chrome'
              browser.warning = errors.getMsgByType('BAD_POLICY_WARNING_TOOLTIP')

        openProject.create(arg, options, {
          onFocusTests: onFocusTests
          onSpecChanged: onSpecChanged
          onSettingsChanged: onSettingsChanged
          onError: onError
          onWarning: onWarning
        })
      .call("getConfig")
      .then(send)
      .catch(sendErr)

    when "close:project"
      openProject.close()
      .then(send)
      .catch(sendErr)

    when "setup:dashboard:project"
      openProject.createCiProject(arg)
      .then(send)
      .catch(sendErr)

    when "get:record:keys"
      openProject.getRecordKeys()
      .then(send)
      .catch(sendErr)

    when "get:specs"
      openProject.getSpecChanges({
        onChange: send
        onError: sendErr
      })

    when "get:runs"
      openProject.getRuns()
      .then(send)
      .catch (err) ->
        err.type = if _.get(err, "statusCode") is 401
          "UNAUTHENTICATED"
        else if _.get(err, "cause.code") is "ESOCKETTIMEDOUT"
          "TIMED_OUT"
        else if _.get(err, "code") is "ENOTFOUND"
          "NO_CONNECTION"
        else
          err.type or "UNKNOWN"

        sendErr(err)

    when "request:access"
      openProject.requestAccess(arg)
      .then(send)
      .catch (err) ->
        err.type = if _.get(err, "statusCode") is 403
          "ALREADY_MEMBER"
        else if _.get(err, "statusCode") is 422 and /existing/.test(err.errors?.userId?.join(''))
          "ALREADY_REQUESTED"
        else
          err.type or "UNKNOWN"

        sendErr(err)

    when "onboarding:closed"
      openProject.getProject()
      .saveState({ showedOnBoardingModal: true })
      .then(sendNull)

    when "ping:api:server"
      apiUrl = konfig("api_url")
      ensureUrl.isListening(apiUrl)
      .then(send)
      .catch (err) ->
        ## if it's an aggegrate error, just send the first one
        if err.length
          subErr = err[0]
          err.name = subErr.name or "#{subErr.code} #{subErr.address}:#{subErr.port}"
          err.message = subErr.message or "#{subErr.code} #{subErr.address}:#{subErr.port}"
        err.apiUrl = apiUrl
        sendErr(err)

    else
      throw new Error("No ipc event registered for: '#{type}'")

module.exports = {
  handleEvent: handleEvent

  stop: ->
    ipc.removeAllListeners()

  start: (options, bus) ->
    ## curry left options
    ipc.on "request", _.partial(@handleEvent, options, bus)

}
