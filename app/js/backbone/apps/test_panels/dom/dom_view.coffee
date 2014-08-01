@App.module "TestPanelsApp.DOM", (DOM, App, Backbone, Marionette, $, _) ->

  class DOM.Layout extends App.Views.LayoutView
    template: "test_panels/dom/layout"