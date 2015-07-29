@App.module "PreferencesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Preferences extends App.Views.ItemView
    template: "preferences/show/preferences"

    ui:
      key: "#api-key"

    events:
      "click @ui.key" : "keyClicked"

    keyClicked: (e) ->
      @ui.key.select()
