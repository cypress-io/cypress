## make this a global to allow attaching / overriding
window.Eclectus = do ($, _) ->

  methods =
    find: (obj, el) ->
      dom = Eclectus.createDom(obj)
      dom.find(el)

    within: (obj, el, fn) ->
      throw new Error("Ecl.within() must be given a callback function!") if not _.isFunction(fn)

      dom = Eclectus.createDom(obj)
      dom = dom.within(el)

      ## scope eclectus methods (within / find) to automatically
      ## pass in our existing dom obj
      Eclectus.scope(dom)

      ## invoke the callback function
      fn.call(dom)

      ## then unscope our existing dom obj
      Eclectus.unscope(dom)

      return dom

    assert: (obj, passed, message, value, actual, expected) ->
      assertion = new Eclectus.Assertion obj.contentWindow, obj.channel, obj.runnable, obj.hook
      assertion.log value, actual, expected, message, passed

    server: (obj) ->
      @sandbox._server = server = obj.contentWindow.sinon.fakeServer.create()
      @sandbox.server = new Eclectus.Xhr obj.contentWindow, obj.channel, obj.runnable, obj.hook
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
      @patch dom, fns

    @unscope = (dom) ->
      fns = {find: methods.find, within: methods.within}
      @patch _(dom).pick("contentWindow", "channel", "runnable"), fns

    @createDom = (argsOrInstance) ->
      obj = dom = argsOrInstance

      ## if dom has the isCommand method then we can be pretty sure
      ## its already a DOM instance
      ## in that case we need to clone it and prevent it from being cloned
      ## again by setting isCloned to true
      if not dom.isCommand
        dom = new Eclectus.Dom obj.contentWindow, obj.channel, obj.runnable, obj.hook

      return dom

  return Eclectus
