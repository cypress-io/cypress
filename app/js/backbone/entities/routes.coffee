@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Route extends Entities.Model
    mutators:
      urlFormatted: ->
        url = @get("url")
        if _.isString(url) then '"' + url + '"' else url

    reset: ->
      @stopListening()
      @log = null
      @clear(silent: true)
      @clear(silent: true)

    getLog: ->
      @log or throw new Error("Route is missing its log reference!")

  class Entities.RoutesCollection extends Entities.Collection
    model: Entities.Route

    createRoute: (log) ->
      attrs = ["testId", "hook", "type", "method", "name", "url", "status", "alias", "numResponses"]

      route     = new Entities.Route log.pick.apply(log, attrs)
      route.log = log

      route.listenTo log, "attrs:changed", (attrs) ->
        route.set attrs

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

    reset: ->
      @invoke "reset"
      super

  App.reqres.setHandler "route:entities", ->
    new Entities.RoutesCollection