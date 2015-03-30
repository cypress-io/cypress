@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      config = App.request "app:config:entity"

      view = @getView(config)

      @listenTo view, "browser:clicked", (browser, version) ->
        # runner.switchToBrowser(browser, version)

      @listenTo view, "close:browser:clicked", ->
        # runner.switchToBrowser()

      ## when the runner triggers load:spec:iframe we load the iframe
      @listenTo runner, "load:spec:iframe", (iframe, options) ->
        @loadIframe view, runner, iframe, options

      @listenTo runner, "revert:dom", (dom, options) ->
        view.revertToDom dom, options

      @listenTo runner, "highlight:el", (el, options) ->
        view.highlightEl el, options

      @listenTo runner, "restore:dom", ->
        view.restoreDom()

      @show view

    loadIframe: (view, runner, specPath, options) ->
      view.loadIframe specPath, options, (contentWindow, remoteIframe) ->
        ## once its loaded we receive the contentWindow
        ## and tell our runner to run the specPath's suite
        runner.run(specPath, contentWindow, remoteIframe, options)

    getView: (config) ->
      new Show.Iframe
        model: config