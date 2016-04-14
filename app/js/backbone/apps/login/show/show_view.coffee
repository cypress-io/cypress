@App.module "LoginApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Login extends App.Views.ItemView
    template: "login/show/login"

    ui:
      login:    "[data-login]"
      retry:    "[data-retry]"
      help:     "[data-js=help]"
      unauth:   "[data-js=unauthed]"

    triggers:
      "click @ui.login"   : "login:clicked"
      "click @ui.help"    : "help:clicked"
      "click @ui.unauth"  : "unauth:clicked"

    modelEvents:
      "change:loggingIn" : "render"
      "change:error"     : "render"

    onShow: ->
      $("html").addClass("login")

    onRender: ->
      loggingIn = @model.get("loggingIn")
      @ui.login.toggleClass("disabled", loggingIn).attr("disabled", loggingIn)

    onDestroy: ->
      $("html").removeClass("login")