@App.module "BuildsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      builds = App.request "build:entities"

      @layout = @getLayoutView()

      @listenTo @layout, "show", ->
        @buildsRegion(builds)

      @show @layout,
        loading:
          entities: builds

    buildsRegion: (builds) ->
      buildsView = @getBuildsView builds

      @listenTo buildsView, "childview:build:clicked", (obj) ->
        App.vent.trigger "show:build", obj.model

      @show buildsView,
        region: @layout.buildsRegion

    getLayoutView: ->
      new List.Layout

    getBuildsView: (builds) ->
      new List.Builds
        collection: builds
