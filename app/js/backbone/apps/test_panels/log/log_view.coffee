@App.module "TestPanelsApp.LOG", (LOG, App, Backbone, Marionette, $, _) ->

  class LOG.Layout extends App.Views.LayoutView
    template: "test_panels/log/layout"