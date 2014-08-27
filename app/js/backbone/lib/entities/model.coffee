@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Model extends Backbone.Model

  App.reqres.setHandler "new:entity", (attrs = {}) ->
    new Entities.Model attrs