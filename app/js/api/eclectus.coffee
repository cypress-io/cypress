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

    server: (obj) ->
      @sandbox._server = server = obj.contentWindow.sinon.fakeServer.create()
      @sandbox.server = new Eclectus.Xhr server, obj.contentWindow.document, obj.channel, obj.runnable

      Eclectus.Xhr.bindServerTo(@, "server", @sandbox.server)

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

    @scope = (dom) ->
      dom.unscope = =>
        @patch _(dom).pick "runnable", "channel", "document"

      @patch dom

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
