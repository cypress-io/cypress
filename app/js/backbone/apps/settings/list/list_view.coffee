@App.module "SettingsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Settings extends App.Views.LayoutView
    template: "settings/list/settings"