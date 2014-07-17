@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      ## when the runner triggers load:iframe we load the iframe
      @listenTo runner, "load:iframe", (iframe) =>
        view.loadIframe iframe, (contentWindow) ->
          ## once its loaded we receive the contentWindow
          ## and tell our runner to run the iframe's suite
          runner.runIframeSuite(contentWindow)

      view = @getView()

      @show view

    getView: ->
      new Show.Iframe