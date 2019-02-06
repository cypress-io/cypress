_ = require('lodash')
$ = require("jquery")
blobUtil = require("blob-util")
minimatch = require("minimatch")
moment = require("moment")
Promise = require("bluebird")
sinon = require("sinon")
lolex = require("lolex")

$dom = require("./dom")
$errorMessages = require("./cypress/error_messages")
$Chainer = require("./cypress/chainer")
$Command = require("./cypress/command")
$Commands = require("./cypress/commands")
$Cookies = require("./cypress/cookies")
$Cy = require("./cypress/cy")
$Events = require("./cypress/events")
$SetterGetter = require("./cypress/setter_getter")
$Keyboard = require("./cypress/keyboard")
$Log = require("./cypress/log")
$Location = require("./cypress/location")
$LocalStorage = require("./cypress/local_storage")
$Mocha = require("./cypress/mocha")
$Runner = require("./cypress/runner")
$Server = require("./cypress/server")
$Screenshot = require("./cypress/screenshot")
$SelectorPlayground = require("./cypress/selector_playground")
$utils = require("./cypress/utils")

proxies = {
  runner: "getStartTime getTestsState getEmissions setNumLogs countByTestState getDisplayPropsForLog getConsolePropsForLogById getSnapshotPropsForLogById getErrorByTestId setStartTime resumeAtTest normalizeAll".split(" ")
  cy: "getStyles".split(" ")
}

jqueryProxyFn = ->
  if not @cy
    $utils.throwErrByPath("miscellaneous.no_cy")

  @cy.$$.apply(@cy, arguments)

_.extend(jqueryProxyFn, $)

## provide the old interface and
## throw a deprecation message
$Log.command = ->
  $utils.throwErrByPath("miscellaneous.command_log_renamed")

throwDeprecatedCommandInterface = (key, method) ->
  signature = switch method
    when "addParentCommand"
      "'#{key}', function(){...}"
    when "addChildCommand"
      "'#{key}', { prevSubject: true }, function(){...}"
    when "addDualCommand"
      "'#{key}', { prevSubject: 'optional' }, function(){...}"

  $utils.throwErrByPath("miscellaneous.custom_command_interface_changed", {
    args: { method, signature }
  })

throwPrivateCommandInterface = (method) ->
  $utils.throwErrByPath("miscellaneous.private_custom_command_interface", {
    args: { method }
  })

serializeError = (err) ->
  _.extend({}, _.pick(err, "name", "message", "stack", "displayMessage"), {
    actual: $utils.stringify(err.actual)
    expected: $utils.stringify(err.expected)
  })

serializeCommand = (command) ->
  if command.attributes
    name = command.get("name")
    args = command.get("args")
  else
    name = command.name
    args = command.args

  {
    name: name
    args: _.reject args, (arg) -> _.isFunction(arg) or _.isObject(arg)
  }

serializeRetry = (retry) ->
  {
    name: retry._name
    error: serializeError(retry.error)
    runnable: serializeTest(retry._runnable)
  }

serializeTest = (test) ->
  _.extend({}, _.pick(test, "async", "body", "file", "id", "pending", "sync", "timedOut", "title", "type"), {
    parentId: test.parent.id
  })

class $Cypress
  constructor: (config = {}) ->
    @cy       = null
    @chai     = null
    @mocha    = null
    @runner   = null
    @Commands = null
    @_RESUMED_AT_TEST = null

    @events = $Events.extend(@)

    $Events.throwOnRenamedEvent(@, "Cypress")

    @setConfig(config)

  setConfig: (config = {}) ->
    ## config.remote
    # {
    #   origin: "http://localhost:2020"
    #   domainName: "localhost"
    #   props: null
    #   strategy: "file"
    # }

    # -- or --

    # {
    #   origin: "https://foo.google.com"
    #   domainName: "google.com"
    #   strategy: "http"
    #   props: {
    #     port: 443
    #     tld: "com"
    #     domain: "google"
    #   }
    # }

    ## set domainName but allow us to turn
    ## off this feature in testing
    if d = config.remote?.domainName
      document.domain = d

    ## a few static props for the host OS, browser
    ## and the current version of Cypress
    @arch = config.arch
    @spec = config.spec
    @version = config.version
    @browser = config.browser
    @platform = config.platform

    ## normalize this into boolean
    config.isTextTerminal = !!config.isTextTerminal

    ## we asumme we're interactive based on whether or
    ## not we're in a text terminal, but we keep this
    ## as a separate property so we can potentially
    ## slice up the behavior
    config.isInteractive = !config.isTextTerminal

    ## enable long stack traces when
    ## we not are running headlessly
    ## for debuggability but disable
    ## them when running headlessly for
    ## performance since users cannot
    ## interact with the stack traces
    Promise.config({
      longStackTraces: config.isInteractive
    })

    {env, remote} = config

    config = _.omit(config, "env", "remote", "resolved", "scaffoldedFiles", "javascripts", "state")

    @state = $SetterGetter.create({})
    @config = $SetterGetter.create(config)
    @env = $SetterGetter.create(env)

    @Cookies = $Cookies.create(config.namespace, d)

    @action("cypress:config", config)

  initialize: ($autIframe) ->
    @cy.initialize($autIframe)

  run: (fn) ->
    $utils.throwErrByPath("miscellaneous.no_runner") if not @runner

    @runner.run(fn)

  ## onSpecWindow is called as the spec window
  ## is being served but BEFORE any of the actual
  ## specs or support files have been downloaded
  ## or parsed. we have not received any custom commands
  ## at this point
  onSpecWindow: (specWindow) ->
    logFn = =>
      @log.apply(@, arguments)

    ## create cy and expose globally
    @cy = window.cy = $Cy.create(specWindow, @, @Cookies, @state, @config, logFn)
    @log = $Log.create(@, @cy, @state, @config)
    @mocha = $Mocha.create(specWindow, @)
    @runner = $Runner.create(specWindow, @mocha, @, @cy)

    ## wire up command create to cy
    @Commands = $Commands.create(@, @cy, @state, @config, @log)

    @events.proxyTo(@cy)

    return null

  action: (eventName, args...) ->
    ## normalizes all the various ways
    ## other objects communicate intent
    ## and 'action' to Cypress
    switch eventName
      when "cypress:stop"
        @emit("stop")

      when "cypress:config"
        @emit("config", args[0])

      when "runner:mocha:start"
        ## mocha runner has begun running the tests
        @emit("run:start")

        return if @_RESUMED_AT_TEST

        if @config("isTextTerminal")
          @emit("mocha", "start", args[0])

      when "runner:mocha:end"
        ## mocha runner has finished running the tests

        ## end may have been caused by an uncaught error
        ## that happened inside of a hook.
        ##
        ## when this happens mocha aborts the entire run
        ## and does not do the usual cleanup so that means
        ## we have to fire the after:test:hooks and
        ## test:end events ourselves
        @emit("run:end")

        if @config("isTextTerminal")
          @emit("mocha", "end", args[0])

      when "runner:set:runnable"
        ## when there is a hook / test (runnable) that
        ## is about to be invoked
        @cy.setRunnable(args...)

      when "runner:mocha:suite:start"
        ## mocha runner started processing a suite
        if @config("isTextTerminal")
          @emit("mocha", "suite", args...)

      when "runner:mocha:suite:end"
        ## mocha runner finished processing a suite
        if @config("isTextTerminal")
          @emit("mocha", "suite end", args...)

      when "runner:mocha:hook:start"
        ## mocha runner started processing a hook
        if @config("isTextTerminal")
          @emit("mocha", "hook", args...)

      when "runner:mocha:hook:end"
        ## mocha runner finished processing a hook
        if @config("isTextTerminal")
          @emit("mocha", "hook end", args...)

      when "runner:mocha:test:start"
        ## mocha runner started processing a hook
        if @config("isTextTerminal")
          @emit("mocha", "test", args...)

      when "runner:mocha:test:end"
        if @config("isTextTerminal")
          @emit("mocha", "test end", args...)

      when "runner:mocha:pass"
        ## mocha runner calculated a pass
        if @config("isTextTerminal")
          @emit("mocha", "pass", args...)

      when "runner:mocha:pending"
        ## mocha runner calculated a pending test
        if @config("isTextTerminal")
          @emit("mocha", "pending", args...)

      when "runner:mocha:fail"
        ## mocha runner calculated a failure
        if @config("isTextTerminal")
          @emit("mocha", "fail", args...)

      when "mocha:runnable:run"
        @runner.onRunnableRun(args...)

      when "runner:test:start"
        ## get back to a clean slate
        @cy.reset()

        @emitToBackend("test:start", serializeTest(args[1]))
        @emit("test:start", args...)

      when "runner:test:start:async"
        ## TODO: handle timeouts here? or in the runner?
        @emitThen("test:start:async", args...)

      when "runner:after:runnable:run:async"
        @emitThen("after:runnable:run:async", args...)

      when "runner:test:end"
        @runner.cleanupQueue(@config("numTestsKeptInMemory"))

        ## this event is how the reporter knows how to display
        ## stats and runnable properties such as errors
        @emitToBackend("test:end", serializeTest(args[1]))
        @emit("test:end", args...)

        if @config("isTextTerminal")
          ## needed for calculating wallClockDuration
          ## and the timings of after + afterEach hooks
          @emit("mocha", "test:end", args[0])

      when "cy:before:all:screenshots"
        @emit("before:all:screenshots", args...)

      when "cy:before:screenshot"
        @emit("before:screenshot", args...)

      when "cy:screenshot"
        @emit("screenshot", args...)

      when "cy:after:all:screenshots"
        @emit("after:all:screenshots", args...)

      when "command:internal:log"
        @runner.addLog(args[0], @config("isInteractive"))

        @emit("internal:log", args...)

      when "command:internal:logChange"
        @runner.addLog(args[0], @config("isInteractive"))

        @emit("internal:logChange", args...)

      when "cy:test:fail"
        ## comes from cypress errors fail()
        @emitMap("test:fail", args...)

      when "cy:stability:changed"
        @emit("stability:changed", args...)

      when "cy:paused"
        @emit("paused", args...)

      when "cy:canceled"
        @emit("canceled")

      when "cy:visit:failed"
        @emit("visit:failed", args[0])

      when "cy:viewport:change"
        @emit("viewport:change", args...)

      when "cy:internal:commandStart"
        @emitToBackend("internal:commandStart", serializeCommand(args[0]))
        @emit("internal:commandStart", args...)

      when "cy:internal:commandEnd"
        @emitToBackend("internal:commandEnd", serializeCommand(args[0]))
        @emit("internal:commandEnd", args...)

      when "cy:internal:commandRetry"
        @emitToBackend("internal:commandRetry", serializeRetry(args[0]))
        @emit("internal:commandRetry", args...)

      when "cy:internal:commandEnqueue"
        @emitToBackend("internal:commandEnqueue", serializeCommand(args[0]))
        @emit("internal:commandEnqueue", args[0])

      when "cy:before:command:queue:end"
        @emit("before:command:queue:end")

      when "cy:command:queue:end"
        @emit("command:queue:end")

      when "cy:page:url:changed"
        @emit("page:url:changed", args[0])

      when "cy:next:subject:prepared"
        @emit("next:subject:prepared", args...)

      when "cy:collect:run:state"
        @emitThen("collect:run:state")

      when "cy:scrolled"
        @emit("internal:scrolled", args...)

      when "app:uncaught:exception"
        @emitMap("uncaught:exception", args...)

      when "app:page:alert"
        @emit("page:alert", args[0])

      when "app:page:confirm"
        @emitMap("page:confirm", args[0])

      when "app:page:confirmed"
        @emit("page:confirmed", args...)

      when "app:page:loading"
        @emit("page:loading", args[0])

      when "app:page:start"
        @cy.onBeforeAppWindowLoad(args[0])

        @emit("page:start", args[0])

      when "app:navigation:changed"
        @emit("navigation:changed", args...)

      when "app:form:submitted"
        @emit("form:submitted", args[0])

      when "app:page:ready"
        @emit("page:ready", args[0])

      when "app:before:window:unload"
        @emit("before:window:unload", args[0])

      when "app:page:end"
        @emit("page:end", args[0])

      when "spec:script:error"
        @emit("script:error", args...)

  backend: (eventName, args...) ->
    new Promise (resolve, reject) =>
      fn = (reply) ->
        if e = reply.error
          ## clone the error object
          ## and set stack cleaned
          ## to prevent bluebird from
          ## attaching long stace traces
          ## which otherwise make this err
          ## unusably long
          err = $utils.cloneErr(e)
          err.__stackCleaned__ = true
          err.backend = true
          reject(err)
        else
          resolve(reply.response)

      @emit("backend:request", eventName, args..., fn)

  automation: (eventName, args...) ->
    ## wrap action in promise
    new Promise (resolve, reject) =>
      fn = (reply) ->
        if e = reply.error
          err = $utils.cloneErr(e)
          err.automation = true
          reject(err)
        else
          resolve(reply.response)

      @emit("automation:request", eventName, args..., fn)

  stop: ->
    @runner.stop()
    @cy.stop()

    @action("cypress:stop")

  addChildCommand: (key, fn) ->
    throwDeprecatedCommandInterface(key, "addChildCommand")

  addParentCommand: (key, fn) ->
    throwDeprecatedCommandInterface(key, "addParentCommand")

  addDualCommand: (key, fn) ->
    throwDeprecatedCommandInterface(key, "addDualCommand")

  addAssertionCommand: (key, fn) ->
    throwPrivateCommandInterface("addAssertionCommand")

  addUtilityCommand: (key, fn) ->
    throwPrivateCommandInterface("addUtilityCommand")

  $: jqueryProxyFn

  ## attach to $Cypress to access
  ## all of the constructors
  ## to enable users to monkeypatch
  $Cypress: $Cypress
  Cy: $Cy
  Chainer: $Chainer
  Cookies: $Cookies
  Command: $Command
  Commands: $Commands
  dom: $dom
  errorMessages: $errorMessages
  Keyboard: $Keyboard
  Location: $Location
  Log: $Log
  LocalStorage: $LocalStorage
  Mocha: $Mocha
  Runner: $Runner
  Server: $Server
  Screenshot: $Screenshot
  SelectorPlayground: $SelectorPlayground
  utils: $utils
  _: _
  moment: moment
  Blob: blobUtil
  Promise: Promise
  minimatch: minimatch
  sinon: sinon
  lolex: lolex

  @create = (config) ->
    new $Cypress(config)

  ## proxy all of the methods in proxies
  ## to their corresponding objects
  _.each proxies, (methods, key) ->
    _.each methods, (method) ->
      $Cypress.prototype[method] = ->
        prop = @[key]

        prop and prop[method].apply(prop, arguments)

## attaching these so they are accessible
## via the runner + integration spec helper
$Cypress.$ = $

module.exports = $Cypress
