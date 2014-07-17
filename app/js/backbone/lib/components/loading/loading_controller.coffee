@App.module "Components.Loading", (Loading, App, Backbone, Marionette, $, _) ->

  class Loading.LoadingController extends App.Controllers.Application

    initialize: (options) ->
      { view, config } = options

      config = if _.isBoolean(config) then {} else config

      _.defaults config,
        loadingType: "spinner"
        entities: @getEntities(view)
        debug: false
        done: ->

      switch config.loadingType
        when "opacity"
          @region.currentView.addOpacityWrapper() if @region.currentView
        when "spinner"
          loadingView = @getLoadingView()
          @show loadingView
          # _.defer ->
            # $(".ui-widget-overlay").addClass("animate")
        else
          throw new Error("Invalid loadingType")

      @showRealView view, loadingView, config

    showRealView: (realView, loadingView, config) ->
      xhrs    = App.request "fetched:entities", config.entities

      ## store the old view here
      oldView = @region.currentView

      ## if the old view closes prior to any of the XHR stuff
      ## we want to remove the opacity wrapper from the old view
      if config.loadingType is "opacity" and oldView
        @listenTo oldView, "close", =>
          ## remove any opacity wrappers
          @removeOpacity(oldView)

      ## ...after the entities are successfully fetched, execute this callback
      $.when(xhrs...).done =>
        ## ================================================================ ##
        ## If the region we are trying to insert is not the loadingView then
        ## we know the user has navigated to a different page while the loading
        ## view was still open. In that case, we know to manually close the original
        ## view so its controller is also closed.  We also prevent showing the real
        ## view (which would snap the user back to the old view unexpectedly)
        ## ================================================================ ##
        return realView.destroy() if loadingView and (@region.currentView isnt loadingView)

        ## show the real view unless we've set debug in the loading options
        @show realView unless config.debug
        config.done(realView)

      $.when(xhrs...).fail =>
        ## we want to close the realView if we've aborted an XHR request
        ## this ensures any instantiated views not yet inside of a region are properly closed
        ## we're allowing aborting because if there are multiple AJAX requests going on we
        ## run the risk of older requests finishing later (race condition) and then
        ## updating the view to an older incorrect request's view
        realView.destroy() unless @region.currentView is realView
        ## also need to handle any error messaging to the client here
        ## --my implementation for that (project specific) --

      ## ...after the entities are finished regardless of success or failure
      $.when(xhrs...).always =>
        return if config.debug

        ## remove any opacity wrappers
        @removeOpacity(oldView) if config.loadingType is "opacity"

        ## we always want to close the loadingView if it exists
        loadingView?.destroy()

        ## and close out the loading controller since its no longer needed regardless
        @destroy()
        @clearFetches(config.entities)

    getEntities: (view) ->
      ## return the entities manually set during configuration, or just pull
      ## off the model and collection from the view (if they exist)
      _.chain(view).pick("model", "collection").toArray().compact().value()

    getLoadingView: ->
      new Loading.LoadingView

    removeOpacity: (oldView) ->
      return if not oldView

      oldView.addOpacityWrapper(false)

    clearFetches: (entities) ->
      delete entity._fetch for entity in _(entities).compact()

  App.commands.setHandler "show:loading", (view, options) ->
    new Loading.LoadingController
      view: view
      region: options.region
      config: options.loading