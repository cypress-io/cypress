@App.module "LoginApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Login extends App.Views.ItemView
    template: "login/show/login"

    ui:
      button: "button"

    triggers:
      "click @ui.button" : "login:clicked"