## make this a global to allow attaching / overriding
window.Eclectus = do ($, _) ->

  methods =
    find: (obj, el) ->
      dom = Eclectus.createDom(obj)
      dom.find(el)

    within: (obj, el, fn) ->
      throw new Error("Ecl.within() must be given a callback function!") if not _.isFunction(fn)

      dom = Eclectus.createDom(obj)
      dom.within(el, fn)

    assert: (obj, passed, message, value, actual, expected) ->
      assertion = new Eclectus.Assertion obj.contentWindow.document, obj.channel, obj.runnable
      assertion.log value, actual, expected, message, passed

    server: (obj) ->
      @sandbox._server = server = obj.contentWindow.sinon.fakeServer.create()
      @sandbox.server = new Eclectus.Xhr obj.contentWindow.document, obj.channel, obj.runnable
      @sandbox.server.setServer server

      Eclectus.Xhr.bindServerTo(@, "server", @sandbox.server)

    ## these should have commands to log out the # of times called
    ## the arguments, etc
    stub: (obj) ->
    mock: (obj) ->
    spy: (obj) ->

  class Eclectus
    ## class method patch
    ## loops through each method and partials
    ## the runnable onto our prototype
    @patch = (args, fns) ->
      ## we want to be able to pass in specific functions to patch here
      ## else use the default methods object
      _.each (fns or methods), (fn, key, obj) ->
        Eclectus.prototype[key] = _.partial(fn, args)

    ## store the sandbox for each iframe window
    ## so all of our Ecl commands can utilize this
    @sandbox = (contentWindow) ->
      Eclectus.prototype.sandbox = contentWindow.sinon.sandbox.create()

    @scope = (dom) ->
      ## only re-patch these specific methods, not the others
      fns = {find: methods.find, within: methods.within}

      dom.unscope = =>
        @patch _(dom).pick("runnable", "channel", "document"), fns

      @patch dom, fns

    @createDom = (argsOrInstance) ->
      obj = dom = argsOrInstance

      try
        ## if this is an instance already just return that
        return dom if dom instanceof Eclectus.Dom

      ## else createDom
      dom = new Eclectus.Dom obj.contentWindow.document, obj.channel, obj.runnable

      ## pass down the scope method?
      dom.scope = _.bind @scope, @, dom

      return dom

  return Eclectus
