@Ecl.module "Views", (Views, App, Backbone, Marionette, $, _) ->

  class Views.CollectionView extends Marionette.CollectionView
    childViewOptions: (model, index) ->
      options = {}
      options.tagName = "li" if @tagName is "ul"
      options