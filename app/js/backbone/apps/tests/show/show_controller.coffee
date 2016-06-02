@App.module "TestsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { id, browser, version } = options

      socket = App.request "socket:entity"

      config = App.request "app:config:entity"

      spec = config.getPathToSpec(id)

      runner = App.request("runner:entity")

      @onDestroy = _.partial(@onDestroy, config, runner)

      @layout = @getLayoutView config

      @listenTo @layout, "show", ->
        @statsRegion(runner)

        @specsRegion(runner, spec)

      @show @layout

    statsRegion: (runner) ->
      App.execute "show:test:stats", @layout.statsRegion, runner

    specsRegion: (runner, spec) ->
      App.execute "list:test:specs", @layout.specsRegion, runner, spec

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