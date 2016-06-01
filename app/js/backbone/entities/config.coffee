@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    setEnv: (env) ->
      @set "env", env

    getPathToSpec: (id) ->
      if id isnt "__all"
        ## if id isnt all then we need to slice
        ## off the first segment which will be either
        ## 'integration' or 'unit'.
        ## TODO: move this logic elsewhere
        id = id.split("/").slice(1).join("/")

      _.compact([@get("integrationFolder"), id]).join("/")

  App.reqres.setHandler "new:config:entity", (attrs = {}) ->
    new Entities.Config attrs
