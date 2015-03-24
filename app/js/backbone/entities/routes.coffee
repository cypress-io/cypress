@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Route extends Entities.Model
    defaults: ->
      numResponses: 0

    mutators:
      urlFormatted: ->
        url = @get("url")
        if _.isString(url) then '"' + url + '"' else url

    getLog: ->
      @log or throw new Error("Route is missing its log reference!")

    hasRoute: (route) ->
      @getLog().get("_route")

    increment: ->
      @set "numResponses", @get("numResponses") + 1

  class Entities.RoutesCollection extends Entities.Collection
    model: Entities.Route

    increment: (routeObj) ->
      route = @find (route) ->
        route.hasRoute(routeObj)

      route.increment() if route

    createRoute: (log) ->
      attrs = ["testId", "hook", "type", "method", "name", "url", "status", "alias"]

      route     = new Entities.Route log.pick.apply(log, attrs)
      route.log = log
      route

    add: (attrs, options) ->
      route = attrs

      ## if we have both of these methods assume this is
      ## a backbone model
      if @isModelInstance(route)

        ## increment the number if its not cloned
        # route.increment(@maxNumber())

        return super(route, options)

      return if _.isEmpty attrs

      super @createRoute(attrs)

  App.reqres.setHandler "route:entities", ->
    new Entities.RoutesCollection