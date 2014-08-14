## make this a global to allow attaching / overriding
window.Eclectus = do ($, _) ->

  methods =
    find: (obj, el) ->
      dom = Eclectus.instantiate(obj)
      dom.find(el)

    within: (obj, el, fn) ->
      throw new Error("Ecl.within() must be given a callback function!") if not _.isFunction(fn)

      dom = Eclectus.instantiate(obj)
      dom.within(el, fn)

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

    @instantiate = (argsOrInstance) ->
      obj = dom = argsOrInstance

      ## if this is an instance already just return that
      return dom if _.isFunction(dom) and dom instanceof Eclectus.DOM

      ## else instantiate
      dom = new Eclectus.Dom obj.document, obj.channel, obj.runnable, obj.prevObject


  return Eclectus
