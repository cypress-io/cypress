@App.module "NavApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      navs = App.request "nav:entities"

      view = @getView(navs)

      @show view

    getView: (navs) ->
      new List.Navs
        collection: navs