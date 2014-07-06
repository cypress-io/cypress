@Ecl.module "Views", (Views, App, Backbone, Marionette, $, _) ->

  _.extend Marionette.View::,
    addOpacityWrapper: (init = true, options = {}) ->
      _.defaults options,
        className: "opacity"

      @$el.toggleWrapper options, @cid, init