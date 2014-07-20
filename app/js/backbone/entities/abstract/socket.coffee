@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Socket extends Entities.Model

  App.reqres.setHandler "io:entity", ->
    new Entities.Socket