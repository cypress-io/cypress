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
      @createSandbox(partial.$remoteIframe)

      @sandbox._server = server = partial.$remoteIframe[0].contentWindow.sinon.fakeServer.create()
      @sandbox.server = new Eclectus.Xhr partial.$remoteIframe, partial.channel, partial.runnable, @hook
      @sandbox.server.setServer server

      Eclectus.Xhr.bindServerTo(@, "server", @sandbox.server)

      ## return the actual sinon server object for additional use in its API
      return server

    assert: (partial, passed, message, value, actual, expected) ->
      assertion = new Eclectus.Assertion partial.$remoteIframe, partial.channel, partial.runnable, @hook
      assertion.log value, actual, expected, message, passed

      return assertion

    stub: (partial, obj, method) ->
      @createSandbox(partial.$remoteIframe)

      stub = @sandbox.stub(obj, method)

      eclStub = new Eclectus.Stub partial.$remoteIframe, partial.channel, partial.runnable, @hook
      eclStub.log(obj, method, stub)

      return stub

    mock: (partial) ->

    spy: (partial, obj, method) ->
      @createSandbox(partial.$remoteIframe)

      spy = @sandbox.spy(obj, method)

      eclSpy = new Eclectus.Spy partial.$remoteIframe, partial.channel, partial.runnable, @hook
      eclSpy.log(obj, method, spy)

      ## return the sinon spy for chainability
      return spy

    visit: (partial, url, options = {}) ->
      df = $.Deferred()

      try
        visit = new Eclectus.Visit partial.$remoteIframe, partial.channel, partial.runnable, @hook
        visit.log url, -> df.resolve()
      catch e
        debugger

      return df

  class Eclectus
    ## restores the sandbox after each test run
    restore: ->
      @sandbox?.restore?()

    createSandbox: ($remoteIframe) ->
      ## bail if its already created
      return if @sandbox

      contentWindow = $remoteIframe[0].contentWindow

      throw new Error("Remote Iframe did not load sinon.js") if not contentWindow.sinon

      ## set sandbox up on the remote iframes sinon sandbox
      @sandbox = contentWindow.sinon.sandbox.create()

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

    @scope = (dom) ->
      ## only re-patch these specific methods, not the others
      fns = {find: methods.find, within: methods.within}
      @patch dom, fns
      @hook dom.hook

    @unscope = (dom) ->
      fns = {find: methods.find, within: methods.within}
      @patch _(dom).pick("$remoteIframe", "channel", "runnable"), fns
      @hook dom.hook

    @createDom = (argsOrInstance) ->
      obj = dom = argsOrInstance

      ## if dom has the isCommand method then we can be pretty sure
      ## its already a DOM instance
      ## in that case we need to clone it and prevent it from being cloned
      ## again by setting isCloned to true
      if not dom.isCommand
        dom = new Eclectus.Dom obj.$remoteIframe, obj.channel, obj.runnable, Eclectus.prototype.hook

      return dom

    @hook = (name) ->
      ## simply store the current hook on our prototype
      Eclectus.prototype.hook = name

  return Eclectus
