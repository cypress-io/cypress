window.$Cypress = do ($, _, Backbone, Promise) ->

  class $Cypress
    constructor: ->
      @cy     = null
      @chai   = null
      @mocha  = null
      @runner = null

    start: ->
      window.Cypress = @

    setConfig: (config = {}) ->
      {environmentVariables} = config

      config = _.omit(config, "environmentVariables")

      $Cypress.EnvironmentVariables.create(@, environmentVariables)
      $Cypress.Config.create(@, config)

      @trigger "config", config

    initialize: (specWindow, $remoteIframe) ->
      ## push down the options
      ## to the runner
      @mocha.options(@runner)

      ## allow mocha + chai to initialize
      ## themselves or any other listeners
      @trigger "initialize",
        specWindow: specWindow
        $remoteIframe: $remoteIframe

      ## let the world know we're ready to
      ## rock and roll
      @trigger "initialized",
        cy: @cy
        runner: @runner
        mocha: @mocha
        chai: @chai

      return @

    ## TODO: TEST THIS
    run: (fn) ->
      throw new Error("Cannot call Cypress#run without a runner instance!") if not @runner

      @runner.run(fn)

    ## TODO: TEST THIS
    ## restore our on callback
    ## after the run completes
    after: (err) ->
      @on = @_on if @_on
      @

    ## TODO: TEST THIS
    set: (runnable, hookName) ->
      $Cypress.Cy.set(@, runnable, hookName)

    window: (specWindow) ->
      cy     = $Cypress.Cy.create(@, specWindow)
      chai   = $Cypress.Chai.create(@, specWindow)
      mocha  = $Cypress.Mocha.create(@, specWindow)
      runner = $Cypress.Runner.create(@, specWindow, mocha)
      log    = $Cypress.Log.create(@, cy)

      ## TODO: TEST THIS
      @prepareForSpecEvents()
      @prepareForCustomCommands()

    onBeforeLoad: (contentWindow) ->
      ## should probably just trigger the "before:window:load"
      ## event here, so other commands can tap into that
      return if not @cy

      @cy.silenceConsole(contentWindow) if $Cypress.isHeadless
      @cy.bindWindowListeners(contentWindow)

      @trigger("before:window:load", contentWindow)

    ## TODO: TEST THIS
    ## we need to specially handle spec events coming
    ## from spec windows.  they will listen to cypress
    ## events so we slurp them up when they happen
    ## and then restore them before binding them
    ## again
    prepareForSpecEvents: ->
      @_specEvents ?= _.extend {}, Backbone.Events

      ## anytime we prepare for spec events
      ## we unbind previous listeners
      @_specEvents.stopListening()

      @_on  = @on
      _this = @

      @on = _.wrap @on, (orig, name, callback, context) ->
        ## if we have context then call through because
        ## that has happened from the specEvents.listenTo
        if context
          orig.call(@, name, callback, context)
        else
          _this._specEvents.listenTo _this, name, callback

        return @

    stop: ->
      ## we immediately delete Cypress due to
      ## abort being async. waiting for the async
      ## event causes problems in other areas in
      ## the system when we cannot tap into this async
      ## method. (such as moving from remote manual
      ## browser back to your own browser)
      delete window.Cypress

      @abort().then =>

        @trigger "stop"

        @removeCustomCommands()

        @off()

    abort: ->
      ## grab all the abort callbacks
      ## instead of triggering them

      ## coerce into an array
      aborts = [].concat @invoke("abort")

      aborts = _.reject aborts, (r) -> r is @cy

      ## abort can be async so make sure
      ## we wait until they all resolve!
      Promise.all(aborts).then => @restore()

    ## restores cypress after each test run by
    ## removing the queue from the proto and
    ## removing additional own instance properties
    restore: ->
      restores = [].concat @invoke("restore")

      restores = _.reject restores, (r) -> r is @cy

      Promise.all(restores).return(null)

    _.extend $Cypress.prototype, Backbone.Events

    @create = (options = {}) ->
      _.defaults options,
        loadModules: false

      Cypress = new $Cypress

      ## attach each of the classes
      ## to the Cypress instance
      for klass in "Cy Log Utils Chai Mocha Runner Agents Server Chainer Location LocalStorage Cookies Keyboard Mouse Command Commands EnvironmentVariables".split(" ")
        Cypress[klass] = $Cypress[klass]

      ## copy the modules by reference too
      Cypress.modules = $Cypress.modules

      ## conditionally load up all of the modules
      ## so that any listeners get attached immediately
      ## prior to instantiating our helper objects
      ## in Cypress#init
      ## TODO: TEST THIS
      Cypress.loadModules() if options.loadModules

      return Cypress

    @extend = (obj) ->
      _.extend @prototype, obj

    ## register a module
    @register = (name, fn) ->
      @modules ?= {}
      @modules[name] = fn
      return @

    @remove = (name) ->
      @modules ?= {}
      delete @modules[name]
      return @

    @reset = ->
      @modules = {}

  return $Cypress