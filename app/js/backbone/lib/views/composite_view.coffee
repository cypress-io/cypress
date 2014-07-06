@Ecl.module "Views", (Views, App, Backbone, Marionette, $, _) ->

  class Views.CompositeView extends Marionette.CompositeView
    constructor: ->
      super

      options = {}
      options.tagName = "tr" if @isTbody()
      options.tagName = "li" if @isUl()

      @childViewOptions = _.extend {}, _.result(@, "childViewOptions"), options

    buildItemView: (item, ItemViewType, childViewOptions) ->
      childViewOptions.tableColumns = @$el.find("th").length if @isTbody()
      super

    isTbody: ->
      @childViewContainer is "tbody"

    isUl: ->
      @childViewContainer is "ul"