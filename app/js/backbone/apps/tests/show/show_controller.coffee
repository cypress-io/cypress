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

      @listenTo @layout, "show", ->
        @iframeRegion(iframe)

        ## start running the tests
        ## and load the iframe
        runner.start(id)

        @statsRegion(runner)
        @specsRegion(runner, iframe, spec)

        socket.emit "watch:test:file", id

      socket.whenAutomationKnown (bool) =>
        if bool
          @show @layout
        else
          ## if we never were able to connect to automation
          ## then we need to display a list of browsers and
          ## close this window down so we can open up correctly
          App.execute "list:automation"

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

    getBrowsersMessageView: (defaultBrowser, browsers) ->
      new Show.BrowsersMessage
        model: defaultBrowser
        browsers: browsers

    getLayoutView: (config) ->
      new Show.Layout
        model: config