## make this a global to allow attaching / overriding
window.Eclectus = do ($, _) ->

  methods =
    find: (partial, el) ->
      dom = Eclectus.createDom(partial)
      dom.find(el)

    within: (partial, el, fn) ->
      throw new Error("Ecl.within() must be given a callback function!") if not _.isFunction(fn)

      dom = Eclectus.createDom(partial)
      dom = dom.within(el)

      ## scope eclectus methods (within / find) to automatically
      ## pass in our existing dom obj
      Eclectus.scope(dom)

      ## invoke the callback function
      fn.call(dom)

      ## then unscope our existing dom obj
      Eclectus.unscope(dom)

      return dom

    server: (partial) ->
      throw new Error("Eclectus.sandbox() must be invoked first") if not @sandbox

      @sandbox._server = server = partial.contentWindow.sinon.fakeServer.create()
      @sandbox.server = new Eclectus.Xhr partial.contentWindow, partial.channel, partial.runnable, @hook
      @sandbox.server.setServer server

      Eclectus.Xhr.bindServerTo(@, "server", @sandbox.server)

    assert: (partial, passed, message, value, actual, expected) ->
      assertion = new Eclectus.Assertion partial.contentWindow, partial.channel, partial.runnable, @hook
      assertion.log value, actual, expected, message, passed

    stub: (partial, obj, method) ->
      throw new Error("Eclectus.sandbox() must be invoked first") if not @sandbox

      stub = @sandbox.stub(obj, method)

      eclStub = new Eclectus.Stub partial.contentWindow, partial.channel, partial.runnable, @hook
      eclStub.log(obj, method, stub)

      return stub

    mock: (partial) ->

    spy: (partial, obj, method) ->
      throw new Error("Eclectus.sandbox() must be invoked first") if not @sandbox

      spy = @sandbox.spy(obj, method)

      eclSpy = new Eclectus.Spy partial.contentWindow, partial.channel, partial.runnable, @hook
      eclSpy.log(obj, method, spy)

      ## return the sinon spy for chainability
      return spy

  class Eclectus
    ## restores the sandbox after each test run
    restore: ->
      @sandbox?.restore?()

    ## class method patch
    ## loops through each method and partials
    ## the runnable onto our prototype
    @patch = (args, fns) ->
      ## we want to be able to pass in specific functions to patch here
      ## else use the default methods object
      _.each (fns or methods), (fn, key, obj) ->
        Eclectus.prototype[key] = _.partial(fn, args)

    ## remove all of the partialed functions from Eclectus prototype
    @unpatch = (fns) ->
      fns = _(methods).keys().concat("hook", "sandbox")
      _.each (fns), (fn, obj) ->
        delete Eclectus.prototype[fn]

    ## store the sandbox for each iframe window
    ## so all of our Ecl commands can utilize this
    @sandbox = (contentWindow) ->
      Eclectus.prototype.sandbox = contentWindow.sinon.sandbox.create()

    @scope = (dom) ->
      ## only re-patch these specific methods, not the others
      fns = {find: methods.find, within: methods.within}
      @patch dom, fns
      @hook dom.hook

    @unscope = (dom) ->
      fns = {find: methods.find, within: methods.within}
      @patch _(dom).pick("contentWindow", "channel", "runnable"), fns
      @hook dom.hook

    @createDom = (argsOrInstance) ->
      obj = dom = argsOrInstance

      ## if dom has the isCommand method then we can be pretty sure
      ## its already a DOM instance
      ## in that case we need to clone it and prevent it from being cloned
      ## again by setting isCloned to true
      if not dom.isCommand
        dom = new Eclectus.Dom obj.contentWindow, obj.channel, obj.runnable, Eclectus.prototype.hook

      return dom

    @hook = (name) ->
      ## simply store the current hook on our prototype
      Eclectus.prototype.hook = name

  return Eclectus
