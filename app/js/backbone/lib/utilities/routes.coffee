@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  window.Routes = do (_, Backbone) ->
    getParams = /(:([\w\d]+)|\*([\w\d]+))/g

    replacePath = (path, part, replacement) ->
      ## return the replaced path or the original
      if replacement? then path.replace(part, replacement) else path

    ## match the parts of the url with the key/val of the object
    parseObject = (parts, path, obj) ->
      _.reduce parts, (memo, part, index) ->
        sliced = part.slice(1)
        memo = replacePath(memo, part, obj[sliced])
      , path

    ## match the parts of the url with the order of the arguments
    parseArray = (parts, path, args) ->
      _.reduce parts, (memo, part, index) ->
        memo = replacePath(memo, part, args[index])
      , path

    extractParams = (args, parts) ->
      parts ?= []

      ## if its an object then check if its keys are greater than the parts
      ## if args is an array, check that its lenght is greater than the parts
      count = if _.isObject(args[0]) then _.keys(args[0]).length else args.length

      ## bail if the count isnt greater than the parts
      return if count <= parts.length

      if _.isObject(args[0])
        extractObjectParams(args[0], parts)
      else
        ## return the 2nd argument (the object)
        args.pop()

    extractObjectParams = (obj, parts) ->
      ## make query params from the object minus the keys that are
      ## used to create the actual base route, which are colors and asterisks
      partsOfRoute = _.map parts, (part) -> part.replace(/(:|\*)/, "")
      _(obj).omit(partsOfRoute...)

    getQueryParams = (path, args, parts) ->
      params = extractParams(args, parts)

      return path if not params

      ## use the Backbone Query Params toFragment method
      ## for generating query params on top of our route
      Backbone.Router::toFragment(path, params)

    createPathFn = (pathString) ->
      parts = pathString.match(getParams)

      return (args...) ->
        path = pathString.toString()

        if args.length
          path = switch
            when _.isObject(args[0])
              parseObject(parts, path, args[0])
            else
              parseArray(parts, path, args)

        ## prepend with forward slash if path isnt an external url
        path = "/" + path if not (/^(http|\/\/)/).test(path)

        path = getQueryParams(path, args, parts)

        path

    addRoutes = (obj, routes) ->
      for name, path of routes
        obj.routes[name] = path
        obj[name + "_path"] = createPathFn path

    class Routes
      constructor: (@routes = {}) ->

    r = new Routes

    r.url_for = (name) ->
      @routes[name]

    ## creates dynamic function and is invoked with args
    r.create = (path, args...) ->
      createPathFn(path).apply(@, args)

    return r