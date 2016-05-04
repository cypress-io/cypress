@App.module "TestsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { id, browser, version } = options

      socket = App.request "socket:entity"

      config = App.request "app:config:entity"

      ## this is for any existing controllers which haven't been
      ## closed yet.  this prevents a bug where we try to replace
      ## existing Show controllers which on destroy stop the runner
      @listenTo config, "change:env", (model, value, options) ->
        @region.empty()

      spec = config.getPathToSpec(id)

      @listenTo config, "change:panels", ->
        @layout.resizePanels()

      ## request and receive the runner entity
      ## which is the mediator of all test framework events
      ## store this as a property on ourselves
      runner = App.request("start:test:runner")

      iframe = runner.iframe
      iframe.setBrowserAndVersion(browser, version) if browser and version

      @onDestroy = _.partial(@onDestroy, config, runner)

      @listenTo iframe, "switch:to:manual:browser", (browser, version) ->
        App.execute "switch:to:manual:browser", id, browser, version

      @layout = @getLayoutView config

      # socket.emit "is:automation:connected", (bool) ->
      #   @browsersMessage() if config.get("isOutsideExtension")

      @listenTo @layout, "show", ->
        ## bail if we're currently headless or we're in
        ## satellite mode
        return if config.get("isHeadless") or config.ui("satellite")

        @statsRegion(runner)
        @specsRegion(runner, iframe, spec)

        socket.emit "watch:test:file", id

        @iframeRegion(iframe)

        ## start running the tests
        ## and load the iframe
        runner.start(id)

      @listenTo socket, "change:automatedConnected", (bool) ->
        @region.empty()
        @browsersMessage()

      socket.whenAutomationKnown (bool) =>
        if bool
          @show @layout
        else
          @automationDisconnected(config.get("browsers"))
          ## show the not connected message

    # socket.on "automation:disconnected", ->
    automationDisconnected: ->
      @region.empty()
      @extensionMessage()

    browsersMessage: (browsers) ->
      browsers = App.request "new:browser:entities", browsers

      defaultBrowser = browsers.extractDefaultBrowser()

      browsersMessageView = @getBrowsersMessageView(defaultBrowser, browsers)

      @show browsersMessageView,
        region: @layout.messageRegion

    extensionMessage: ->
      extensionMessageView = @getExtensionMessageView()

      @show extensionMessageView,
        region: @region

    statsRegion: (runner) ->
      App.execute "show:test:stats", @layout.statsRegion, runner

    iframeRegion: (iframe) ->
      App.execute "show:test:iframe", @layout.iframeRegion, iframe

    specsRegion: (runner, iframe, spec) ->
      App.execute "list:test:specs", @layout.specsRegion, runner, iframe, spec

    onDestroy: (config, runner) ->
      ## nuke our cookies when we leave
      App.clearAllCookies()
      config.trigger "close:test:panels"
      App.request "stop:test:runner", runner

    getExtensionMessageView: ->
      new Show.ExtensionMessage

    getBrowsersMessageView: (defaultBrowser, browsers) ->
      new Show.BrowsersMessage
        model: defaultBrowser
        browsers: browsers

    getLayoutView: (config) ->
      new Show.Layout
        model: config