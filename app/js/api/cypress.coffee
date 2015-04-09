window.$Cypress = do ($, _, Backbone) ->

  class $Cypress
    constructor: ->
      @cy     = null
      @chai   = null
      @mocha  = null
      @runner = null

      window.Cypress = @

    initialize: (specWindow, $remoteIframe, config) ->
      ## push down the options
      ## to the runner
      @mocha.options(@runner)

      ## allow mocha + chai to initialize
      ## themselves or any other listeners
      @trigger "initialize",
        specWindow: specWindow
        $remoteIframe: $remoteIframe
        config: config

      ## set our defaults
      @defaults()

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
    set: (runnable, hookName) ->
      $Cypress.Cy.set(@, runnable, hookName)

    window: (specWindow) ->
      cy     = $Cypress.Cy.create(@, specWindow)
      chai   = $Cypress.Chai.create(@, specWindow)
      mocha  = $Cypress.Mocha.create(@, specWindow)
      runner = $Cypress.Runner.create(@, specWindow, mocha)

    defaults: ->
      @trigger "defaults"

    stop: ->
      @abort().then =>

        @trigger "stop"

        @off()

        delete window.Cypress

    abort: ->
      ## grab all the abort callbacks
      ## instead of triggering them

      ## coerce into an array
      aborts = [].concat @invoke("abort")

      ## abort can be async so make sure
      ## we wait until they all resolve!
      Promise.all(aborts).then => @restore()

    ## restores cypress after each test run by
    ## removing the queue from the proto and
    ## removing additional own instance properties
    restore: ->
      @trigger "restore"
      @defaults()
      return @

    @create = (options = {}) ->
      _.defaults options,
        loadModules: false

      Cypress = new $Cypress

      ## attach each of the classes
      ## to the Cypress instance
      for klass in "Cy Log Utils Chai Mocha Runner Agents Server Chainer Location LocalStorage".split(" ")
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