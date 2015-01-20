@App.module "FooterApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      footerView = @getFooterView()

      @listenTo footerView, "login:clicked", (view, obj) ->
        App.execute "login:request"

      @listenTo footerView, "reload:clicked", ->
        App.execute "gui:reload"

      @listenTo footerView, "console:clicked", ->
        App.execute "gui:console"

      @show footerView

    getFooterView: ->
      new Show.Footer