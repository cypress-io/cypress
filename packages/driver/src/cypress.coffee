_ = require('lodash')
$ = require("jquery")
Backbone = require("backbone")
blobUtil = require("blob-util")
minimatch = require("minimatch")
moment = require("moment")
Promise = require("bluebird")
sinon = require("sinon")
lolex = require("lolex")
Cookies = require("js-cookie")
bililiteRange = require("../vendor/bililiteRange")

$Chai = require("./cypress/chai")
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

    $Events.extend(@)

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
    @isHeadless = !!config.isHeadless

    {environmentVariables, remote} = config

    config = _.omit(config, "environmentVariables", "remote")

    @config = $SetterGetter.create(config)
    @env = $SetterGetter.create(environmentVariables)

    @Cookies = $Cookies.create(config.namespace, d)

    @emit("config", config)

  initialize: (specWindow, $remoteIframe) ->
    ## push down the options
    ## to the runner
    @mocha.options(@runner)

    ## allow mocha + chai to initialize
    ## themselves or any other listeners
    @emit("initialize", {
      specWindow: specWindow
      $remoteIframe: $remoteIframe
    })

    ## let the world know we're ready to
    ## rock and roll
    @emit("initialized", {
      cy: @cy
      runner: @runner
      mocha: @mocha
      chai: @chai
    })

    return @

  run: (fn) ->
    $utils.throwErrByPath("miscellaneous.no_runner") if not @runner

    @runner.run(fn)

  getStartTime: ->
    @runner.getStartTime()

  getTestsState: ->
    @runner.getTestsState()

  getEmissions: ->
    @runner.getEmissions()

  countByTestState: (tests, state) ->
    @runner.countByTestState(tests, state)

  getDisplayPropsForLog: (attrs) ->
    @runner.getDisplayPropsForLog(attrs)

  getConsolePropsForLogById: (logId) ->
    @runner.getConsolePropsForLogById(logId)

  getSnapshotPropsForLogById: (logId) ->
    @runner.getSnapshotPropsForLogById(logId)

  getErrorByTestId: (testId) ->
    @runner.getErrorByTestId(testId)

  checkForEndedEarly: ->
    @cy and @cy.checkForEndedEarly()

  onUncaughtException: ->
    @cy.onUncaughtException.apply(@cy, arguments)

  ## TODO: TEST THIS
  set: (runnable, hookName) ->
    $Cypress.Cy.set(@, runnable, hookName)

  ## onSpecWindow is called as the spec window
  ## is being served but BEFORE any of the actual
  ## specs or support files have been downloaded
  ## or parsed. we have not received any custom commands
  ## at this point
  onSpecWindow: (specWindow) ->
    ## create cy and expose globally
    @cy = window.cy = $Cy.create(specWindow)

    mocha    = $Mocha.create(@, specWindow)
    runner   = $Runner.create(@, specWindow, mocha)

    ## TODO: fix this
    # @log     = $Log.create(@, cy)

    ## wire up command create to cy
    @Commands = $Commands.create(@, @cy)

    $Chai.create(specWindow, @cy)

  onBeforeLoad: (contentWindow) ->
    ## should probably just trigger the "before:window:load"
    ## event here, so other commands can tap into that
    return if not @cy

    @cy.silenceConsole(contentWindow) if @isHeadless
    @cy.bindWindowListeners(contentWindow)
    @cy._setWindowDocumentProps(contentWindow)

    @emit("before:window:load", contentWindow)

  abort: ->
    @emitThen("abort")
    .then =>
      @restore()

  ## restores cypress after each test run by
  ## removing the queue from the proto and
  ## removing additional own instance properties
  restore: ->
    @emitThen("restore")
    .return(null)

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

  command: (obj = {}) ->
    $utils.warning "Cypress.command() is deprecated. Please update and use: Cypress.Log.command()"

    $Log.command(obj)

  $: ->
    if not @cy
      $utils.throwErrByPath("miscellaneous.no_cy")

    @cy.$$.apply(@cy, arguments)

  ## attach to $Cypress to access
  ## all of the constructors
  ## to enable users to monkeypatch
  $Cypress: $Cypress

  Location: $Location

  Log: $Log

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

## TODO: make these return object and do $Cypress.extend() here
require("./cypress/snapshot")($Cypress)

## attach these to the prototype
## instead of $Cypress
$Cypress.$ = $
$Cypress.Chai = $Chai
$Cypress.Chainer = $Chainer
$Cypress.Command = $Command
$Cypress.Commands = $Commands
$Cypress.Cookies = $Cookies
$Cypress.Cy = $Cy
$Cypress.Dom = $Cypress.prototype.Dom = $Dom
$Cypress.Events = $Events
$Cypress.ErrorMessages = $ErrorMessages
$Cypress.Keyboard = $Keyboard
$Cypress.Log = $Log
$Cypress.Location = $Location
$Cypress.LocalStorage = $LocalStorage
$Cypress.Mocha = $Mocha
$Cypress.Runner = $Runner
$Cypress.Server = $Cypress.prototype.Server = $Server
$Cypress.utils = $utils

## expose globally (temporarily for the runner)
window.$Cypress = $Cypress

module.exports = $Cypress



## QUESTION:
## Do we need to expose $Cypress?
## how do we attach submodules / other utilities?
## move things around / reorganize how its attached
