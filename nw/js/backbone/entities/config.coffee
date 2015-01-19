@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    env: (str) ->
      @get("env") is str

  class Entities.ProjectsCollection extends Entities.Collection
    model: Entities.Project

  App.reqres.setHandler "config:entity", (attrs = {}) ->
    new Entities.Config attrs