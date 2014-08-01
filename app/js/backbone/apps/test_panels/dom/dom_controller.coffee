@App.module "TestPanelsApp.DOM", (DOM, App, Backbone, Marionette, $, _) ->

  class DOM.Controller extends App.Controllers.Application
    initialize: (options) ->
      { panel } = options

      @show new DOM.Layout