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

    listeners: (runner, Cypress) ->
      @listenTo runner, "before:run", ->
        @isRunning(true)

      @listenTo runner, "after:run", ->
        @isRunning(false)

      @listenTo Cypress, "stop", =>
        @stopListening()

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

    ## should probably rename this to be something like
    ## 'command:hovered'.  Since our App.config is dictating
    ## interpreting the behavior and then dictating what
    ## exactly should happen.  The other areas are simply
    ## broadcasting events.  This should move out of App.config
    ## as well to something else. Perhaps an app or a utility.
    revertDom: (command, init = true) ->
      ## dont revert, instead fire a completely different
      ## message
      return @trigger("cannot:revert:dom", init) if @isRunning()

      return @trigger "restore:dom" if not init

      return if not command.hasSnapshot()

      @trigger "revert:dom", command.getSnapshot(),
        id:       command.cid
        el:       command.getEl()
        attr:     command.get("highlightAttr")
        coords:   command.get("coords")
        scrollBy: command.get("scrollBy")

    highlightEl: (command, init = true) ->
      @trigger "highlight:el", command.getEl(),
        id: command.cid
        init: init

  App.reqres.setHandler "iframe:entity", (runner, Cypress) ->
    iframe = new Entities.Iframe
    iframe.listeners(runner, Cypress)
    iframe