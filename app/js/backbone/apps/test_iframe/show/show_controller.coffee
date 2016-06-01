@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { iframe } = options

      config = App.request "app:config:entity"

      @layout = @getLayoutView(iframe)

      @listenTo iframe, "loaded", (cb, contentWindow, remoteIframe, options) ->
        ## once its loaded we receive the contentWindow
        ## we invoke the callback which tells our runner
        ## to run the specPath's suite
        cb(contentWindow, remoteIframe, options)

      @listenTo iframe, "load:spec:iframe", (cb, options) ->
        @layout.loadIframes options, (contentWindow, remoteIframe) ->
          ## once the iframes are loaded we trigger this event
          ## which prevents forcing callbacks if we've navigated
          ## away from the page and we're already shut down
          iframe.trigger "loaded", cb, contentWindow, remoteIframe, options

      @listenTo iframe, "detach:body", (cb) ->
        cb @layout.detachBody()

      @listenTo @layout, "show", ->
        ## dont show the header in satellite mode
        return if config.ui("satellite")

        @headerView(iframe)
        @snapshotView(iframe)

      @show @layout

    headerView: (iframe) ->
      headerView = @getHeaderView(iframe)

      @listenTo headerView, "browser:clicked", (browser, version) ->
        iframe.switchToBrowser(browser, version)

      @listenTo headerView, "close:browser:clicked", ->
        iframe.switchToBrowser()

      @show headerView, region: @layout.headerRegion

    snapshotView: (iframe) ->
      snapshotView = @getSnapshotView(iframe)

      @show snapshotView, region: @layout.messageRegion

    getSnapshotView: (iframe) ->
      new Show.Snapshot
        model: iframe

    getHeaderView: (iframe) ->
      new Show.Header
        model: iframe

    getLayoutView: (iframe) ->
      new Show.Layout
        model: iframe