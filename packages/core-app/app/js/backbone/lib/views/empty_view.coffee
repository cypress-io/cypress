@App.module "Views", (Views, App, Backbone, Marionette, $, _) ->

  class Views.EmptyView extends Marionette.ItemView
    template: "_empty"

    ui:
      container: ":first"

    constructor: ->
      super
      @$el.addClass "empty"

    serializeData: ->
      containerTag: @getContainerTag()
      content: _.result(@, "content") ? "No items found."

    onShow: ->
      @ui.container.prop("colspan", @options.tableColumns) if @isRow()

    isRow: ->
      @tagName is "tr"

    getContainerTag: ->
      return "td" if @isRow()
      return "div"