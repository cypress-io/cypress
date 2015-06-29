@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { reporter } = options

      config = App.request "app:config:entity"

      ## set the initial config values from
      ## our config entity
      reporter.setConfig(config)

      @layout = @getLayoutView(reporter)

      @listenTo @layout, "browser:clicked", (browser, version) ->
        # reporter.switchToBrowser(browser, version)

      @listenTo @layout, "close:browser:clicked", ->
        # reporter.switchToBrowser()

      ## when the reporter triggers load:spec:iframe we load the iframe
      @listenTo reporter, "load:spec:iframe", (iframe, options) ->
        @loadIframe @layout, reporter, iframe, options

      ## TODO MOVE ALL THESE EVENTS DIRECTLY
      ## INTO THE LAYOUTVIEW
      @listenTo reporter, "cannot:revert:dom", (init) ->
        @layout.cannotRevertDom(init)

      @listenTo reporter, "revert:dom", (dom, options) ->
        @layout.revertToDom dom, options

      @listenTo reporter, "highlight:el", (el, options) ->
        @layout.highlightEl el, options

      @listenTo reporter, "restore:dom", ->
        @layout.restoreDom()

      @listenTo @layout, "show", ->
        ## dont show the header in satelitte mode
        return if config.ui("satelitte")

        @headerView(reporter)

      @show @layout

    loadIframe: (view, reporter, specPath, options) ->
      view.loadIframe specPath, options, (contentWindow, remoteIframe) ->
        ## once its loaded we receive the contentWindow
        ## and tell our reporter to run the specPath's suite
        reporter.run(specPath, contentWindow, remoteIframe, options)

    headerView: (reporter) ->
      headerView = @getHeaderView(reporter)
      @show headerView, region: @layout.headerRegion

    getHeaderView: (reporter) ->
      new Show.Header
        model: reporter

    getLayoutView: (reporter) ->
      new Show.Layout
        model: reporter