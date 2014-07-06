@Ecl.module "Views", (Views, App, Backbone, Marionette, $, _) ->

  class Views.CompositeView extends Marionette.CompositeView
    constructor: ->
      super

      options = {}
      options.tagName = "tr" if @isTbody()
      options.tagName = "li" if @isUl()

      @itemViewOptions = _.extend {}, _.result(@, "itemViewOptions"), options

    buildItemView: (item, ItemViewType, itemViewOptions) ->
      itemViewOptions.tableColumns = @$el.find("th").length if @isTbody()
      super

    isTbody: ->
      @itemViewContainer is "tbody"

    isUl: ->
      @itemViewContainer is "ul"