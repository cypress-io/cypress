@App.module "TestPanelsApp.DOM", (DOM, App, Backbone, Marionette, $, _) ->

  class DOM.Layout extends App.Views.LayoutView
    template: "test_panels/dom/layout"

  class DOM.Dom extends App.Views.ItemView
    template: "test_panels/dom/_dom"

  class DOM.Doms extends App.Views.CollectionView
    tagName: "ul"
    childView: DOM.Dom