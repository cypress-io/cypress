@App.module "BuildsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { build } = options

      build ?= App.request "build:entity"

      @layout = @getLayoutView(build)

      @show @layout,
        loading:
          entities: build

    getLayoutView: (build) ->
      new Show.Layout
        model: build
