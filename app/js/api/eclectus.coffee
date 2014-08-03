## make this a global to allow attaching / overriding
window.Eclectus = do ($, _) ->

  methods =
    find: (obj, el) ->
      dom = new Eclectus.Dom obj.contentWindow.document
      obj.channel.trigger "dom", obj.runnable,
        node: el
        el: dom.$(el)
        dom: dom.$("body").clone(true, true)
        method: "find"

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

  return Eclectus
