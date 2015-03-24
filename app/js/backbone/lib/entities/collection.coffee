@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Collection extends Backbone.Collection
    isModelInstance: (model) ->
      try
        model instanceof Entities.Model
      catch
        false