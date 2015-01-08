@App.module "TestRoutesApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Route extends App.Views.ItemView
    template: "test_routes/list/_route"

  class List.Routes extends App.Views.CompositeView
    template: "test_routes/list/routes"
    childView: List.Route
    childViewContainer: "tbody"

    className: "instruments-container"
