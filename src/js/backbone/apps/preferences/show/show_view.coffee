@App.module "PreferencesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Preferences extends App.Views.ItemView
    template: "preferences/show/preferences"

    ui:
      key:      "#api-key"
      generate: "#generate-api-key"
      refresh:  "i.fa-refresh"

    events:
      "click @ui.key" : "keyClicked"

    triggers:
      "click @ui.generate" : "generate:clicked"

    modelEvents:
      "change:token"           : "render"
      "change:error"           : "render"
      "change:generatingToken" : "generatingTokenChanged"

    generatingTokenChanged: (model, value) ->
      if value
        ## if we are generating a token make button disabled
        @ui.generate.attr("disabled", "disabled")
      else
        @ui.generate.removeAttr("disabled")

      @ui.refresh.toggleClass("fa-spin", value)

    keyClicked: (e) ->
      @ui.key.select()
