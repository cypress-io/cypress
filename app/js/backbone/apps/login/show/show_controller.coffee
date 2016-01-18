@App.module "LoginApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      user = App.request "current:user"

      loginView = @getLoginView(user)

      @listenTo loginView, "login:clicked", (view, obj) ->
        user.unset("error")
        App.execute "login:request"

      @show loginView

    getLoginView: (user) ->
      new Show.Login
        model: user