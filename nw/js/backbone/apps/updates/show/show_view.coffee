@App.module "UpdatesApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Updates extends App.Views.ItemView
    template: "updates/show/updates"

    ui:
      ".state" : "state"

    modelEvents:
      "change:state" : "render"

    onRender: ->
      if @model.hasError()
        @ui.state.addClass("text-danger")