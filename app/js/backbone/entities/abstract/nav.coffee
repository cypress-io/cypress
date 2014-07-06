@Ecl.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Nav extends Entities.Model

  class Entities.NavsCollection extends Entities.Collection
    model: Entities.Nav