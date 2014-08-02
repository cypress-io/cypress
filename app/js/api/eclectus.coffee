## make this a global to allow attaching / overriding
window.Eclectus = do ($, _, Mocha) ->

  methods =
    find: (title, el) ->
      console.warn "finding", title, el

  class Eclectus
    constructor: (@logs = [], @xhrs = []) ->

    ## class method path
    ## loops through each method and partial
    ## the runnable onto our prototype
    @patch: (runnable) ->
      _.each methods, (fn, key, obj) ->
        Eclectus.prototype[key] = _.partial(fn, runnable)

  return Eclectus
