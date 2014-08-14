## make this a global to allow attaching / overriding
window.Eclectus = do ($, _) ->

  methods =
    find: (obj, el) ->
      command = Eclectus.createCommand(obj)
      command.find(el)

    within: (obj, el, fn) ->
      throw new Error("Ecl.within() must be given a callback function!") if not _.isFunction(fn)

      command = Eclectus.createCommand(obj)
      command.within(el, fn)

  class Eclectus
    constructor: (@logs = [], @xhrs = []) ->

    ## class method patch
    ## loops through each method and partials
    ## the runnable onto our prototype
    ## i think besides passing runnable i should pass
    ## a bus object for passing messages through instead
    ## of relying on the runnable object having an 'emit' method
    @patch = (args) ->
      _.each methods, (fn, key, obj) ->
        Eclectus.prototype[key] = _.partial(fn, args)

    @scope = (instance) ->
      instance.unscope = =>
        @patch _(runnable).pick "runnable", "channel", "document"

      @patch instance

    @createCommand = (argsOrInstance) ->
      obj = command = argsOrInstance

      ## if this is an instance already just return that
      return command if _.isFunction(command) and command instanceof Eclectus.DOM

      ## else createCommand
      command = new Eclectus.Command obj.document, obj.channel, obj.runnable

      ## pass down the scope method?
      command.scope = _.partial @scope, command

  return Eclectus
