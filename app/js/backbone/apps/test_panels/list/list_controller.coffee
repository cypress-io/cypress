@App.module "TestPanelsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { runner } = options

      @show new List.Layout