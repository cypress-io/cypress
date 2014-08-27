@App.module "TestPanelsApp.XHR", (XHR, App, Backbone, Marionette, $, _) ->

  class XHR.Layout extends App.Views.LayoutView
    template: "test_panels/xhr/layout"