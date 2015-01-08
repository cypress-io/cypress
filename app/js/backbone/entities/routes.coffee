@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Route extends Entities.Model
    defaults: ->
      numResponses: 0

    mutators:
      urlFormatted: ->
        url = @get("url")
        if _.isString(url) then '"' + url + '"' else url

  class Entities.RoutesCollection extends Entities.Collection
    model: Entities.Route

    add: (attrs, options) ->
      route = attrs

      ## if we have both of these methods assume this is
      ## a backbone model
      if route and route.set and route.get

        ## increment the number if its not cloned
        # route.increment(@maxNumber())

        return super(route, options)

      return if _.isEmpty attrs

      super attrs

  App.reqres.setHandler "route:entities", ->
    new Entities.RoutesCollection