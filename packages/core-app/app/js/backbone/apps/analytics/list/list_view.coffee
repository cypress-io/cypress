@App.module "AnalyticsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Analytics extends App.Views.LayoutView
    template: "analytics/list/analytics"