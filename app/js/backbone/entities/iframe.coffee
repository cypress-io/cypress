@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Iframe extends Entities.Model
    defaults: ->
      browser: null
      version: null
      message: null
      running: false
      detachedId: null
      viewportScale: 1

    mutators:
      viewportScale: ->
        Math.ceil(parseFloat(@attributes.viewportScale) * 100).toFixed(0)

    initialize: ->
      @state = {}

    listeners: (runner, Cypress) ->
      @listenTo runner, "before:run", ->
        @isRunning(true)

      @listenTo runner, "after:run", ->
        @isRunning(false)

      @listenTo Cypress, "stop", =>
        @stop()

      @listenTo Cypress, "viewport", (viewport) =>
        @setViewport(viewport)

      @listenTo Cypress, "url:changed", (url) =>
        @setUrl(url)

      @listenTo Cypress, "page:loading", (bool) =>
        @setPageLoading(bool)

    load: (cb, options) ->
      _.defaults options,
        browser:  @get("browser")
        version:  @get("version")

      @trigger "load:spec:iframe", cb, options

    stop: ->
      @state = {}
      @stopListening()

    setConfig: (config) ->
      @set config.pick("viewportWidth", "viewportHeight")

    setScale: (scale) ->
      @set "viewportScale", scale

    setViewport: (viewport) ->
      @set
        viewportWidth:  viewport.width
        viewportHeight: viewport.height

    setUrl: (url) ->
      @set "url", url

    setPageLoading: (bool = true) ->
      @set "pageLoading", bool

    isRunning: (bool) ->
      if arguments.length
        @set "running", bool
      else
        @get("running")

    commandExit: (command) ->
      ## bail if we have no originalBody
      return if not body = @state.originalBody

      ## backup the current command's detachedId
      previousDetachedId = @state.detachedId

      ## we're using a setImmediate here because mouseleave will fire
      ## before mouseenter.  and we dont want to restore the dom if we're
      ## about to be hovering over a different command, else that would
      ## be a huge waste.
      setImmediate =>
        ## we want to only restore the dom if we havent hovered over
        ## to another command by the time this setImmediate function runs
        return if previousDetachedId isnt @state.detachedId

        @trigger "restore:dom", body

        @state.detachedId = null

    commandEnter: (command) ->
      ## dont revert, instead fire a completely different
      ## message if we are currently running
      return @trigger("cannot:revert:dom") if @isRunning()

      return @commandExit() if not command.hasSnapshot()

      if body = @state.originalBody
        @trigger "revert:dom", body
        @revertDom(body, command)
      else
        @trigger "detach:body", _.once (body) =>
          @state.originalBody = body
          @revertDom(body, command)

    revertDom: (body, command) ->
      @trigger "revert:dom", body

      @state.detachedId = command.id

      if el = command.getEl()
        @trigger "highlight:el", el, _(command).pick("id", "coords", "highlightAttr", "scrollBy")

      return @

    highlightEl: (command, init = true) ->
      @trigger "highlight:el", command.getEl(),
        id: command.cid
        init: init

  App.reqres.setHandler "iframe:entity", (runner, Cypress) ->
    iframe = new Entities.Iframe
    iframe.listeners(runner, Cypress)
    iframe