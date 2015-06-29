@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      config = App.request "app:config:entity"

      @layout = @getLayoutView(config)

      @listenTo @layout, "browser:clicked", (browser, version) ->
        # runner.switchToBrowser(browser, version)

      @listenTo @layout, "close:browser:clicked", ->
        # runner.switchToBrowser()

      ## when the runner triggers load:spec:iframe we load the iframe
      @listenTo runner, "load:spec:iframe", (iframe, options) ->
        @loadIframe @layout, runner, iframe, options

      ## TODO MOVE ALL THESE EVENTS DIRECTLY
      ## INTO THE LAYOUTVIEW
      @listenTo config, "cannot:revert:dom", (init) ->
        @layout.cannotRevertDom(init)

      @listenTo config, "revert:dom", (dom, options) ->
        @layout.revertToDom dom, options

      @listenTo config, "highlight:el", (el, options) ->
        @layout.highlightEl el, options

      @listenTo config, "restore:dom", ->
        @layout.restoreDom()

      @listenTo @layout, "show", ->
        @headerView(config)

      @show @layout

    loadIframe: (view, runner, specPath, options) ->
      view.loadIframe specPath, options, (contentWindow, remoteIframe) ->
        ## once its loaded we receive the contentWindow
        ## and tell our runner to run the specPath's suite
        runner.run(specPath, contentWindow, remoteIframe, options)

    headerView: (config) ->
      return if config.ui("satelitte")

      headerView = @getHeaderView(config)
      @show headerView, region: @layout.headerRegion

    getHeaderView: (config) ->
      new Show.Header
        model: config

    getLayoutView: (config) ->
      new Show.Layout
        model: config