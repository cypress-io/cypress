@App.module "LoginApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      loginView = @getLoginView()

      @listenTo loginView, "login:clicked", (view, obj) ->
        App.execute "login:request"

      @show loginView

    getLoginView: ->
      new Show.Login