@Ecl.module "NavApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Nav extends App.Views.ItemView
    template: "nav/list/_nav"
    className: "parent"

  class List.Navs extends App.Views.CompositeView
    template: "nav/list/navs"
    childView: List.Nav
    childViewContainer: "ul"