@App.module "Views", (Views, App, Backbone, Marionette, $, _) ->

  _mixinTemplateHelpers = Marionette.View::mixinTemplateHelpers

  _.extend Marionette.View::,
    mixinTemplateHelpers: (target) ->
      target.env = App.config.env()
      target.debug = App.config.get("debug")

      _mixinTemplateHelpers.call(@, target)

    stopProp: (e) ->
      e.stopPropagation()