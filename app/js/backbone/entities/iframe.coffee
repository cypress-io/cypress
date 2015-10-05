@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Iframe extends Entities.Model
    defaults: ->
      url: null
      browser: null
      version: null
      message: null
      running: false
      revertUrl: false
      detachedId: null
      pageLoading: false
      viewportScale: 1

    mutators:
      viewportScale: ->
        Math.ceil(parseFloat(@attributes.viewportScale) * 100).toFixed(0)

    initialize: ->
      @state = {}
      @set @defaults()

    listeners: (runner, Cypress) ->
      @listenTo runner, "before:run", ->
        @initialize()
        @isRunning(true)

      @listenTo runner, "after:run", ->
        @isRunning(false)

      @listenTo Cypress, "initialize", (obj) =>
        {config} = obj

        @setViewport _(config).pick("viewportHeight", "viewportWidth")

      @listenTo Cypress, "stop", =>
        @stop()

      @listenTo Cypress, "viewport", (viewport) =>
        @setViewport(viewport)

      @listenTo Cypress, "url:changed", (url) =>
        @setUrl(url)

      @listenTo Cypress, "page:loading", (bool) =>
        @setPageLoading(bool)

    load: (cb, options) ->
      ## add src and url to options here

      _.defaults options,
        browser:  @get("browser")
        version:  @get("version")

      @trigger "load:spec:iframe", cb, options

    stop: ->
      @initialize()
      @stopListening()

    getMessageCssCoords: (height, width) ->
      iframeActualHeight = @get("iframeHeight") * @attributes.viewportScale

      marginLeft = (@get("containerWidth") / 2) - (width / 2)

      heightHeight = 46
      nudge = 10

      if (iframeActualHeight + height + nudge) >= @get("containerHeight")
        {top: "", bottom: 0, marginLeft: marginLeft, opacity: "0.7"}
      else
        {top: (iframeActualHeight + heightHeight + nudge), bottom: "", marginLeft: marginLeft, opacity: "0.9"}

    setHeightsAndWidth: (containerHeight, iframeHeight, containerWidth, iframeWidth) ->
      @set({
        containerHeight: containerHeight
        containerWidth: containerWidth
        iframeHeight: iframeHeight
        iframeWidth: iframeWidth
      })

    setScale: (scale) ->
      @set "viewportScale", scale

    setViewport: (viewport) ->
      @set(viewport)
      @trigger "resize:viewport"

    setUrl: (url) ->
      @set "url", url

    setPageLoading: (bool = true) ->
      @set "pageLoading", bool

    setBrowserAndVersion: (browser, version) ->
      @set
        browser: browser
        version: version

    switchToBrowser: (browser, version) ->
      @trigger "switch:to:manual:browser", browser, version

    isRunning: (bool) ->
      if arguments.length
        @set "running", bool
      else
        @get("running")

    commandExit: (command) ->
      ## bail if we have no originalBody
      return @trigger("clear:revert:message") if not body = @state.originalBody

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

        @restoreViewport()
        @restoreUrl()
        @trigger "restore:dom", body

        @state.detachedId = null

    commandEnter: (command) ->
      ## dont revert, instead fire a completely different
      ## message if we are currently running
      return @trigger("cannot:revert:dom") if @isRunning()

      return @commandExit() if not snapshot = command.getSnapshot()

      if body = @state.originalBody
        @revertDom(snapshot, command)
      else
        @trigger "detach:body", _.once (body) =>
          @state.originalBody = body
          @revertDom(snapshot, command)

    restoreViewport: ->
      viewport = _(@state).pick("viewportWidth", "viewportHeight")

      return if _.isEmpty(viewport)

      @setViewport(viewport)

    revertViewport: (viewport) ->
      if not (@state.viewportWidth and @state.viewportHeight)
        ## backup previous viewport if we dont currently
        ## have one
        @state.viewportWidth  = @get("viewportWidth")
        @state.viewportHeight = @get("viewportHeight")

      ## reset our viewport to the command
      @setViewport(viewport)

    setRevertUrl: (bool = true) ->
      @set "revertUrl", bool

    restoreUrl: ->
      return if not url = @state.url

      @setUrl(url)
      @setRevertUrl(false)

    revertUrl: (url) ->
      if not (@state.url)
        @state.url = @get("url")

      @setUrl(url)
      @setRevertUrl()

    revertDom: (snapshot, command) ->
      @revertViewport(command.pick("viewportWidth", "viewportHeight"))

      @revertUrl(command.get("url"))

      @trigger "revert:dom", snapshot

      @state.detachedId = command.cid

      if el = command.getEl()
        options     = command.pick("coords", "highlightAttr", "scrollBy")
        options.dom = snapshot
        @trigger "highlight:el", el, options

      return @

    highlightEl: (command, init = true) ->
      @trigger "highlight:el", command.getEl(),
        id: command.cid
        init: init

  App.reqres.setHandler "iframe:entity", (runner, Cypress) ->
    iframe = new Entities.Iframe
    iframe.listeners(runner, Cypress)
    iframe