@App.module "TestPanelsApp.LOG", (LOG, App, Backbone, Marionette, $, _) ->

  class LOG.Controller extends App.Controllers.Application
    initialize: (options) ->
      { panel } = options

      @show new LOG.Layout