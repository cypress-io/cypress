@Ecl.module "Routers", (Routers, App, Backbone, Marionette, $, _) ->

  ## match named params or splats and capture them
  routeParams = /(:([\w\d]+)|\*([\w\d]+))/g

  class Routers.Application
    ## default: add itself to application and register routes
    initialize: true

    ## default: don't belong to a module
    module: undefined

    ## default: update URL when actions are invoked
    updateUrl: true

    ## default: before / after functions prior to invoking actions
    before: ->
    after: ->

    ## maps the actions to the corresponding controller
    controllerMap:
      "list"    : "List"
      "show"    : "Show"
      "edit"    : "Edit"
      "new"     : "New"
      "destroy" : "Destroy"

    constructor: ->
      ## store the routes key and callback values
      @routes = @_createRoutes()

      @handlers = @_createHandlers()

      ## add to the application if initialize is true
      ## and we actually have some routes
      App.addRouter(@) if @initialize and @hasRoutes()

    ## think about renaming to 'into' or 'load' or 'enter' or 'action'
    to: (action, options = {}) ->
      ## add throw here if action doesn't exist?
      @handlers[action](options)

    hasRoutes: ->
      !_.isEmpty(@routes)

    _createRoutes: ->
      routes = @_getActions (action, key) =>
        ## return empty object if action is undefined
        ## or it simply doesn't have a route definition
        return [] if _.isUndefined(action) or !_(action).has("route")

        ## return array of route, key
        [action.route, key]

      @_toObject(routes)

    _createHandlers: ->
      handlers = @_getActions (action, key) =>
        fn = (options) =>
          ## backup our resolve here since its sliced out of the options

          resolve = options.resolve

          ## instantiate our controller
          controller = new (@_getController(action, key))(options)

          ## attempt to resolve the deferred if its a callable function
          ## which is the default behavior
          ## return our controller instance as the resolution
          resolve?(controller)

        fn = _.wrap fn, (orig, args...) =>
          ## we'll normalize all of the backbone arguments
          ## as well as our own function invocation to be
          ## a POJO

          options = @_normalizeArguments(args, action, key)

          df = $.Deferred()

          ## give our deferred a unique id so
          ## its more easily tracked
          df._id = _.uniqueId("deferred")

          ## set the options default
          ## to have our resolve object
          _.defaults options,
            resolve: df.resolve

          ## pass our deferred into the controller
          ## unless we're resolving it by default
          ## outside of the controller.
          ## this allows manually control over when
          ## our deferred is resolved and with what
          options.deferred = df if not options.resolve

          before = @_invokeBefore(options, action)

          return if before is false

          ## update the url here unless action.updateUrl is false
          ## or @updateUrl is false
          @_updateUrl(action, options) if @_shouldUpdateUrl(action, args)

          ## if before returns a promise, defer kicking off until its done resolved
          $.when(before).done => orig.call(@, options)

          return df

        [key, fn]

      @_toObject(handlers)

    _normalizeArguments: (args, action, key) ->
      ## normalizes the arguments the action is invoked
      ## with into an object

      ## if all the arguments are strings parse them into an object
      ## because we've received them from the backbone router
      args[0] = @_parseStringMatches(args, action, key) if @_argsArePresentAndStrings(args)

      ## reset to empty object if null or undefined
      args[0] ?= {}

      ## merge defaultParams into args
      defaultParams = if _.isFunction(action?.defaultParams) then action.defaultParams.call(@) else action?.defaultParams
      _.defaults args[0], (defaultParams or {})

      ## return object
      return args[0]

    _parseStringMatches: (args, action, key) ->
      route = action?.route

      ## if this is a string and we dont have routes
      ## throw an error, we must be passed an object
      throw new Error("Routes must be defined on the action: #{key}") if not route

      ## match named params or splats and capture them as an obj
      _.reduce args, (memo, arg) ->
        i = _(args).indexOf arg
        matches = route.match(routeParams)
        memo[matches[i].slice(1)] = arg
        memo
      , {}

    _invokeBefore: (options, action) ->
      return if not before = @_shouldInvokeBefore(action)

      ## call the before callback as the instance's context
      before.call(@, options)

    _shouldInvokeBefore: (action) ->
      action?.before or @before

    _interpolateUrl: (action, options) ->
      ## remove region from the params automatically
      Routes.create action.route, _(options).omit("region")

    _updateUrl: (action, options) ->
      route = @_interpolateUrl(action, options)

      ## navigate to this route if after we strip off the first forward slash
      ## these two routes don't match
      App.visit(route) if App.currentRoute() isnt route.replace(/^\//, "")

    _shouldUpdateUrl: (action, args) ->
      ## bail if our action isn't routable
      ## or if all the args are strings - which means we've just
      ## navigated to this route and was triggered through the router
      return false if not action?.route or @_argsArePresentAndStrings(args)

      ## also bail if our router has a splat in it
      ## and doesnt provide a routing cue
      ## so we know how to fill in the values in the splat or id
      ## assume the :id stuff is a property on the model

      ## return the actions updateUrl
      return action?.updateUrl if action and _(action).has("updateUrl")

      ## else return the value of updateUrl
      @updateUrl

    _getActions: (fn) ->
      _(@actions).map (action, key) =>
        action = _.result(@actions, key)
        fn(action, key)

    _getController: (action, key) ->
      ## grab the controller definined on the action if its a constructor
      ## else if controller is a string use it based on the module
      ## or use the default controllerMap off of the module
      ## should attempt to also classify the key to find a controller

      switch
        when _.isFunction(action?.controller) then action.controller
        when _.isUndefined(@module) then throw new Error("Module must be defined on the resource in order to instantiate a controller")
        when _.isString(action?.controller) then @_getControllerConstructor(@module[action.controller])
        else @_getControllerConstructor(@module[@controllerMap[key]], @controllerMap[key], @module.moduleName)

    _getControllerConstructor: (obj, key, module) ->
      ## try to find the Controller constructor on our object
      try
        if _.isFunction(obj) then obj else obj.Controller
      catch err
        throw new Error("The '#{key}' Controller was not found for for the module: '#{module}'")

    _argsArePresentAndStrings: (args) ->
      not _.isEmpty(args) and _.all args, _.isString

    _toObject: (array) ->
      ## takes the multi dimensional array
      ## removes any empty array values
      ## converts to an object
      _.chain(array).reject(_.isEmpty).object().value()

  ## add resource to list of initializers
  ## figure out its routes and handlers
  ## instantiate handlers
  App.addRouter = (resource) ->
    App.addInitializer ->
      new Marionette.AppRouter
        appRoutes: resource.routes
        controller: resource.handlers