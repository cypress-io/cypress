@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Updates extends App.Views.ItemView
    template: "updates/show/updates"

    modelEvents:
      "change:state" : "render"

    onRender: ->
      console.log "updates rendering", @model.get("state"), @model.get("stateFormatted")