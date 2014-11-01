@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      config = App.request "app:config:entity"

      view = @getView(config)

      @listenTo view, "browser:clicked", (browser, version) ->
        runner.switchToBrowser(browser, version)

      ## when the runner triggers load:iframe we load the iframe
      @listenTo runner, "load:iframe", (iframe, options) ->
        @loadIframe view, runner, iframe, options

      @listenTo runner, "revert:dom", (dom, options) ->
        view.revertToDom dom, options

      @listenTo runner, "highlight:el", (el, options) ->
        view.highlightEl el, options

      @show view

    loadIframe: (view, runner, iframe, options) ->
      view.loadIframe iframe, options, (contentWindow, remoteIframe) ->
        ## once its loaded we receive the contentWindow
        ## and tell our runner to run the iframe's suite
        runner.runIframeSuite(iframe, contentWindow, remoteIframe, options)

    getView: (config) ->
      new Show.Iframe
        model: config