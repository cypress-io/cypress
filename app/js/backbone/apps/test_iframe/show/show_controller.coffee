@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      config = App.request "app:config:entity"

      view = @getView(config)

      ## when the runner triggers load:iframe we load the iframe
      @listenTo runner, "load:iframe", (iframe) ->
        @loadIframe view, runner, iframe

      @listenTo runner, "revert:dom", (dom, options) ->
        view.revertToDom dom, options

      @listenTo runner, "highlight:el", (el, options) ->
        view.highlightEl el, options

      @show view

    loadIframe: (view, runner, iframe) ->
      view.loadIframe iframe, (contentWindow, remoteIframe) ->
        ## once its loaded we receive the contentWindow
        ## and tell our runner to run the iframe's suite
        runner.runIframeSuite(iframe, contentWindow, remoteIframe)

    getView: (config) ->
      new Show.Iframe
        model: config