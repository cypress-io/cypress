@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Command extends Entities.Model
    getDom: ->
      @dom

    getEl: ->
      @el

  class Entities.CommandsCollection extends Entities.Collection
    model: Entities.Command

  App.reqres.setHandler "command:entities", ->
    new Entities.CommandsCollection