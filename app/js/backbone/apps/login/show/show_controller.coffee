@App.module "LoginApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      user = App.request "current:user"

      loginView = @getLoginView(user)

      @listenTo loginView, "login:clicked", (view, obj) ->
        user.unset("error")
        App.execute "login:request"

      @listenTo loginView, "unauth:clicked", ->
        App.ipc("external:open", "https://on.cypress.io/guides/installing-and-running#section-your-email-has-not-been-authorized-")

      @listenTo loginView, "help:clicked", ->
        App.ipc("external:open", "https://docs.cypress.io")

      @show loginView

    getLoginView: (user) ->
      new Show.Login
        model: user