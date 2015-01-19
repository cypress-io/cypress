@App.module "FooterApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      footerView = @getFooterView()

      @listenTo footerView, "login:clicked", (view, obj) ->
        App.execute "login:request"

      @show footerView

    getFooterView: ->
      new Show.Footer