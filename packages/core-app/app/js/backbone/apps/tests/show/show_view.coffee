@App.module "TestsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "tests/show/test"

    ui:
      iframeWrapper: "#iframe-wrapper"
      panelWrapper: "#panel-wrapper"

    modelEvents:
      "change:panels" : "panelsChanged"

    onShow: ->
      @panelsChanged()

    panelsChanged: ->
      ## whenever the panels change we reset our offset
      ## for the iframe wrapper
      right = if @model.anyPanelOpen()
        @model.get("panelWidth")
      else
        0

      @ui.iframeWrapper.css "right", right

    resizePanels: ->
      ## get the panels height
      height = @model.calculatePanelHeight()

      @ui.panelWrapper.children().each (index, el) =>

        ## find each region by the panelWrappers children
        found = @regionManager.find (region) -> region.$el.is(el)

        ## bail if we couldnt find the region
        return if not found

        ## set its height to the calculated height or 0 if it is empty
        num = if found.$el.children().length then height else 0
        found.$el.css "height", "#{num}%"

    hideIframe: ->
      @ui.iframeWrapper.hide()