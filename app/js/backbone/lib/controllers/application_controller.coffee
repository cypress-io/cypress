@App.module "Controllers", (Controllers, App, Backbone, Marionette, $, _) ->

  class Controllers.Application extends Marionette.Controller

    constructor: (options = {}) ->
      @region = options.region ? App.request "default:region"
      super

    show: (view, options = {}) ->
      ## allow us to pass in a controller instance instead of a view
      ## if controller instance, set view to the mainView of the controller
      view = if view instanceof Controllers.Application then view.getMainView() else view
      throw new Error("getMainView() did not return a view instance or #{view?.constructor?.name} is not a view instance") if not view

      _.defaults options,
        loading: false
        region: @region

      @setMainView view
      @_manageView view, options

    getMainView: ->
      @_mainView

    setMainView: (view) ->
      ## the first view we show is always going to become the mainView of our
      ## controller (whether its a layout or another view type).  So if this
      ## *is* a layout, when we show other regions inside of that layout, we
      ## check for the existance of a mainView first, so our controller is only
      ## closed down when the original mainView is closed.

      return if @_mainView
      @_mainView = view
      @listenTo view, "destroy", @destroy

    ## called when the main view is first shown
    onMainShow: ->

    _manageView: (view, options) ->
      if options.loading
        ## show the loading view
        App.execute "show:loading", view, options
      else
        options.region.show view if options.region