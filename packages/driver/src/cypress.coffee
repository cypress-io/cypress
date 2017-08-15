_ = require('lodash')
$ = require("jquery")
blobUtil = require("blob-util")
minimatch = require("minimatch")
moment = require("moment")
Promise = require("bluebird")
sinon = require("sinon")
lolex = require("lolex")
Cookies = require("js-cookie")
bililiteRange = require("../vendor/bililiteRange")

$Chainer = require("./cypress/chainer")
$Command = require("./cypress/command")
$Commands = require("./cypress/commands")
$Cookies = require("./cypress/cookies")
$Cy = require("./cypress/cy")
$Dom = require("./cypress/dom")
$Events = require("./cypress/events")
$SetterGetter = require("./cypress/setter_getter")
$ErrorMessages = require("./cypress/error_messages")
$Keyboard = require("./cypress/keyboard")
$Log = require("./cypress/log")
$Location = require("./cypress/location")
$LocalStorage = require("./cypress/local_storage")
$Mocha = require("./cypress/mocha")
$Runner = require("./cypress/runner")
$Server = require("./cypress/server")

$utils = require("./cypress/utils")

proxies = {
  runner: "getStartTime getTestsState getEmissions setNumLogs countByTestState getDisplayPropsForLog getConsolePropsForLogById getSnapshotPropsForLogById getErrorByTestId setStartTime resumeAtTest normalizeAll".split(" ")
  cy: "checkForEndedEarly getStyles".split(" ")
}

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

class $Cypress
  constructor: (config = {}) ->
    @cy       = null
    @chai     = null
    @mocha    = null
    @runner   = null
    @Commands = null
    @_RESUMED_AT_TEST = null

    @events = $Events.extend(@)

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

    @version = config.version

    ## normalize this into boolean
    config.isTextTerminal = !!config.isTextTerminal

    ## we asumme we're interactive based on whether or
    ## not we're in a text terminal, but we keep this
    ## as a separate property so we can potentially
    ## slice up the behavior
    config.isInteractive = !config.isTextTerminal

    if not config.isInteractive
      ## disable long stack traces when
      ## we are running headlessly for
      ## performance since users cannot
      ## interact with the stack traces
      ## anyway
      Promise.config({
        longStackTraces: false
      })

    {environmentVariables, remote} = config

    config = _.omit(config, "environmentVariables", "remote")

    @state = $SetterGetter.create({})
    @config = $SetterGetter.create(config)
    @env = $SetterGetter.create(environmentVariables)

    @Cookies = $Cookies.create(config.namespace, d)

    @action("cypress:config", config)

  initialize: ($autIframe) ->
    ## push down the options
    ## to the runner
    @mocha.options(@runner)

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
    @runner = $Runner.create(@mocha, @)

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

      when "runner:start"
        ## mocha runner has begun running the tests
        @emit("run:start")

        return if @_RESUMED_AT_TEST

        if @config("isTextTerminal")
          @emit("mocha", "start")

      when "runner:end"
        ## mocha runner has finished running the tests

        ## end may have been caused by an uncaught error
        ## that happened inside of a hook.
        ##
        ## when this happens mocha aborts the entire run
        ## and does not do the usual cleanup so that means
        ## we have to fire the test:after:hooks and
        ## test:after:run events ourselves
        @emit("run:end")

        if @config("isTextTerminal")
          @emit("mocha", "end")

        ## TODO: we may not need to do any of this
        ## it appears only afterHooksAsync is needed
        ## for taking a screenshot - which can likely
        ## be done better (and likely doesnt need to wait
        ## until after the hooks have run anyway!)
        ##
        ## the test:after:run event is only used for
        ## cleaning up num tests kept in memory


        ## if we have a test and err
        # test = _this.test
        # err  = test and test.err
        #
        # ## and this err is uncaught
        # if err and err.uncaught
        #
        #   ## fire all the events
        #   testEvents.afterHooksAsync(_this, test)
        #   .then ->
        #     testEvents.afterRun(_this, test)
        #
        #     end()
        # else
        #   end()

      when "runner:set:runnable"
        ## when there is a hook / test (runnable) that
        ## is about to be invoked
        @cy.setRunnable(args...)

      when "runner:suite:start"
        ## mocha runner started processing a suite
        if @config("isTextTerminal")
          @emit("mocha", "suite", args...)

      when "runner:suite:end"
        ## mocha runner finished processing a suite
        if @config("isTextTerminal")
          @emit("mocha", "suite end", args...)

      when "runner:hook:start"
        ## mocha runner started processing a hook
        if @config("isTextTerminal")
          @emit("mocha", "hook", args...)

      when "runner:hook:end"
        ## mocha runner finished processing a hook
        if @config("isTextTerminal")
          @emit("mocha", "hook end", args...)

      when "runner:test:start"
        ## mocha runner started processing a hook
        if @config("isTextTerminal")
          @emit("mocha", "test", args...)

      when "runner:test:end"
        ## mocha runner finished processing a hook
        @cy.checkForEndedEarly()

        if @config("isTextTerminal")
          @emit("mocha", "test end", args...)

      when "runner:pass"
        ## mocha runner calculated a pass
        if @config("isTextTerminal")
          @emit("mocha", "pass", args...)

      when "runner:pending"
        ## mocha runner calculated a pending test
        if @config("isTextTerminal")
          @emit("mocha", "pending", args...)

      when "runner:fail"
        ## mocha runner calculated a failure
        if @config("isTextTerminal")
          @emit("mocha", "fail", args...)

      when "mocha:runnable:run"
        @runner.onRunnableRun(args...)

      when "runner:test:before:run"
        ## get back to a clean slate
        @cy.reset()

        @emit("test:before:run", args...)

      when "runner:test:before:run:async"
        ## TODO: handle timeouts here? or in the runner?
        @emitThen("test:before:run:async", args...)

      when "runner:test:after:run"
        @runner.cleanupQueue(@config("numTestsKeptInMemory"))

        @emit("test:after:run", args...)

      when "command:enqueue"
        "asdf"

      when "command:log:added"
        @runner.addLog(args[0], @config("isInteractive"))

        @emit("log:added", args...)

      when "command:log:changed"
        @runner.addLog(args[0], @config("isInteractive"))

        @emit("log:changed", args...)

      when "cy:fail"
        ## comes from cypress errors fail()
        @emit("fail", args...)

      when "cy:stability:changed"
        @emit("stability:changed", args...)

      when "cy:paused"
        @emit("paused", args...)

      when "cy:visit:failed"
        @emit("visit:failed", args[0])

      when "cy:viewport:changed"
        @emit("viewport:changed", args...)

      when "cy:app:scrolled"
        @emit("app:scrolled", args...)

      when "cy:command:start"
        @emit("command:start", args...)

      when "cy:command:end"
        @emit("command:end", args...)
      when "cy:command:retry"
        @emit("command:retry", args...)

      when "cy:command:enqueued"
        @emit("command:enqueued", args[0])

      when "cy:command:queue:before:end"
        @emit("command:queue:before:end")

      when "cy:command:queue:end"
        @emit("command:queue:end")

      when "cy:url:changed"
        @emit("url:changed", args[0])

      when "cy:next:subject:prepared"
        @emit("next:subject:prepared", args...)

      when "cy:collect:run:state"
        @emitThen("collect:run:state")

      when "app:page:loading"
        @emit("page:loading", args[0])

      when "app:before:window:load"
        @cy.onBeforeAppWindowLoad(args[0])

        @emit("before:window:load", args[0])

      when "app:navigation:changed"
        @emit("navigation:changed", args...)

      when "app:form:submitted"
        @emit("form:submitted", args[0])

      when "app:window:load"
        @emit("window:load", args[0])

      when "app:before:window:unload"
        @emit("before:window:unload", args[0])

      when "app:window:unload"
        @emit("window:unload", args[0])

      when "spec:script:error"
        @emit("script:error", args...)

  backend: (eventName, args...) ->
    new Promise (resolve, reject) =>
      fn = (reply) ->
        if e = reply.error
          err = $utils.cloneErr(e)
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

  $: ->
    if not @cy
      $utils.throwErrByPath("miscellaneous.no_cy")

    @cy.$$.apply(@cy, arguments)

  ## attach to $Cypress to access
  ## all of the constructors
  ## to enable users to monkeypatch
  $Cypress: $Cypress

  Cy: $Cy

  Chainer: $Chainer

  Keyboard: $Keyboard
  Location: $Location

  Log: $Log

  LocalStorage: $LocalStorage

  Server: $Server

  utils: $utils

  _: _

  moment: moment

  Blob: blobUtil

  Promise: Promise

  minimatch: minimatch

  sinon: sinon

  lolex: lolex

  bililiteRange: bililiteRange

  _.extend $Cypress.prototype.$, _.pick($, "Event", "Deferred", "ajax", "get", "getJSON", "getScript", "post", "when")

  @create = (config) ->
    new $Cypress(config)

  @extend = (obj) ->
    _.extend @prototype, obj

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

## expose globally (temporarily for the runner)
window.$Cypress = $Cypress

module.exports = $Cypress

## QUESTION:
## Do we need to expose $Cypress?
## how do we attach submodules / other utilities?
## move things around / reorganize how its attached
