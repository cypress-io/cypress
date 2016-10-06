@App.module "Views", (Views, App, Backbone, Marionette, $, _) ->

  _mixinTemplateHelpers = Marionette.View::mixinTemplateHelpers

  _.extend Marionette.View::,
    addOpacityWrapper: (init = true, options = {}) ->
      _.defaults options,
        className: "opacity"

      @$el.toggleWrapper options, @cid, init

    mixinTemplateHelpers: (target) ->
      target.ui = App.config.get("ui")

      _mixinTemplateHelpers.call(@, target)

    stopProp: (e) ->
      e.stopPropagation()