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

    server: (obj) ->
      @sandbox._server = server = obj.contentWindow.sinon.fakeServer.create()
      @sandbox.server = new Eclectus.Xhr server, obj.channel, obj.runnable

    ## these should have commands to log out the # of times called
    ## the arguments, etc
    stub: (obj) ->
    mock: (obj) ->

  class Eclectus
    ## class method patch
    ## loops through each method and partials
    ## the runnable onto our prototype
    @patch = (args) ->
      _.each methods, (fn, key, obj) ->
        Eclectus.prototype[key] = _.partial(fn, args)

    ## store the sandbox for each iframe window
    ## so all of our Ecl commands can utilize this
    @sandbox = (contentWindow) ->
      Eclectus.prototype.sandbox = contentWindow.sinon.sandbox.create()

    @scope = (command) ->
      command.unscope = =>
        @patch _(command).pick "runnable", "channel", "document"

      @patch command

    @createCommand = (argsOrInstance) ->
      obj = command = argsOrInstance

      try
        ## if this is an instance already just return that
        return command if command instanceof Eclectus.Command

      ## else createCommand
      command = new Eclectus.Command obj.contentWindow.document, obj.channel, obj.runnable

      ## pass down the scope method?
      command.scope = _.bind @scope, @, command

      return command

  return Eclectus
