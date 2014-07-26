@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      socket = App.request "socket:entity"

      view = @getView()

      ## partial apply the view instance and the runner
      ## to the loadIframe method
      @loadIframe = _.partial(@loadIframe, view, runner)

      ## whenever our socket notifies us of a file change
      ## we will reload the iframe
      @listenTo socket, "test:changed", @loadIframe

      ## when the runner triggers load:iframe we load the iframe
      @listenTo runner, "load:iframe", @loadIframe

      @show view

    loadIframe: (view, runner, iframe) ->
      view.loadIframe iframe, (contentWindow) ->
        ## once its loaded we receive the contentWindow
        ## and tell our runner to run the iframe's suite
        runner.runIframeSuite(iframe, contentWindow)

    getView: ->
      new Show.Iframe