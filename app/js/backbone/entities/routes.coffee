@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Route extends Entities.Model
    defaults: ->
      numResponses: 0

    mutators:
      urlFormatted: ->
        url = @get("url")
        if _.isString(url) then '"' + url + '"' else url

    hasRoute: (route) ->
      @_route is route

    increment: ->
      @set "numResponses", @get("numResponses") + 1

  class Entities.RoutesCollection extends Entities.Collection
    model: Entities.Route

    increment: (routeObj) ->
      route = @find (route) ->
        route.hasRoute(routeObj)

      route.increment() if route

    createRoute: (attrs) ->
      route         = new Entities.Route(attrs)
      route._route  = attrs._route
      route

    add: (attrs, options) ->
      route = attrs

      ## if we have both of these methods assume this is
      ## a backbone model
      if route and route.set and route.get

        ## increment the number if its not cloned
        # route.increment(@maxNumber())

        return super(route, options)

      return if _.isEmpty attrs

      super @createRoute(attrs)

  App.reqres.setHandler "route:entities", ->
    new Entities.RoutesCollection