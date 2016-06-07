@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  regExpCharacters = /[-\/\\^$*+?.()|[\]{}]/g

  class Entities.Runner extends Entities.Model
    initialize: ->
      @logs      = {}
      @commands  = App.request "command:entities"
      @routes    = App.request "route:entities"
      @agents    = App.request "agent:entities"
      @socket    = App.request "socket:entity"
      @stats     = App.request "stats:entity", @

      @listenTo @socket, "runnables:ready", (root) =>
        @reset()

        @trigger("reporter:restart:test:run")

        @trigger("before:add")

        @process(root)

        @trigger("after:add")

      @listenTo @socket, "run:start", =>
        @trigger "run:start"

      @listenTo @socket, "run:end", =>
        @trigger "run:end"

      @listenTo @socket, "test:before:hooks", (test) =>
        @trigger "test:before:hooks", test

      @listenTo @socket, "test:after:hooks", (test) =>
        @trigger "test:after:hooks", test

      @listenTo @socket, "reporter:restart:test:run", ->
        @trigger "reporter:restart:test:run"

        @socket.emit "reporter:restarted"

      @listenTo @socket, "reporter:log:add", (log) =>
        @logs[log.id] = @addLog(log)

      @listenTo @socket, "reporter:log:state:changed", (attrs) ->
        log = @logs[attrs.id]
        log.set(attrs) if log

    sendError: (id) ->
      @socket.emit("runner:console:error", id)

    sendCommand: (id) ->
      @socket.emit("runner:console:log", id)

    restart: ->
      @socket.emit("runner:restart")

    abort: ->
      @socket.emit("runner:abort")

    addLog: (log) ->
      switch log.instrument
        when "command"
          @commands.add log
        # when "route"
        #   @routes.add log
        # when "agent"
        #   @agents.add log
        # else
        #   throw new Error("Cypress.log() emitted an unknown instrument: #{log.instrument}")

    process: (parent) ->
      _.each {test: parent.tests, suite: parent.suites}, (runnables, type) =>
        _.each runnables, (runnable) =>
          runnable.type = type
          runnable.parent = parent
          @trigger("#{type}:add", runnable)
          @process(runnable)

    stop: ->
      @restore()

    restore: ->
      ## reset the entities
      @reset()

      ## and remove actual references to them
      _.each ["commands", "routes", "agents", "chosen", "specPath", "socket", "iframe", "Cypress"], (obj) =>
        @[obj] = null

    reset: ->
      _.each [@commands, @routes, @agents], (collection) ->
        collection.reset([], {silent: true})

    logResults: (test) ->
      @trigger "test:results:ready", test

  App.reqres.setHandler "runner:entity", ->
    new Entities.Runner
