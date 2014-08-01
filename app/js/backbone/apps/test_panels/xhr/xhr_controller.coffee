@App.module "TestPanelsApp.XHR", (XHR, App, Backbone, Marionette, $, _) ->

  class XHR.Controller extends App.Controllers.Application
    initialize: (options) ->
      { panel } = options

      @show new XHR.Layout