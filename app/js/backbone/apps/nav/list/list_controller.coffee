@App.module "NavApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      navs    = App.request "nav:entities"
      config  = App.request "app:config:entity"

      view = @getView(navs, config)

      @show view

    getView: (navs, config) ->
      new List.Navs
        collection: navs
        model: config