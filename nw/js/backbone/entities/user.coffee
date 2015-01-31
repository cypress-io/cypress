@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.User extends Entities.Model

  App.reqres.setHandler "new:user:entity", (attrs = {}) ->
    new Entities.User attrs