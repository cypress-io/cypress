@App.module "DebugApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Log extends App.Views.ItemView
    template: "debug/show/_log"

  class Show.Empty extends App.Views.EmptyView
    content: "Can't find any logs"

  class Show.Debug extends App.Views.CompositeView
    template: "debug/show/debug"
    emptyView: Show.Empty
    childView: Show.Log
    childViewContainer: "tbody"

    ui:
      "clear"   : "[data-clear]"
      "refresh" : "[data-refresh]"

    triggers:
      "click @ui.clear"   : "clear:clicked"
      "click @ui.refresh" : "refresh:clicked"