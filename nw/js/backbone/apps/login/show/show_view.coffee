@App.module "LoginApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Login extends App.Views.ItemView
    template: "login/show/login"

    ui:
      button: "button"

    triggers:
      "click @ui.button" : "login:clicked"

    modelEvents:
      "change:loggingIn" : "render"

    onRender: ->
      loggingIn = @model.get("loggingIn")
      @ui.button.toggleClass("disabled", loggingIn).attr("disabled", loggingIn)