## make this a global to allow attaching / overriding
window.Eclectus = do ($, _, Mocha) ->

  class Eclectus
    constructor: (@logs = [], @xhrs = []) ->

  return Eclectus
