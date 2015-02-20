@App.module "FooterApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: ->
      layoutView = @getLayoutView()

      @listenTo layoutView, "show", ->
        @updateRegion(layoutView.updateRegion)
        @bottomRegion(layoutView.bottomRegion)

      @show layoutView

    updateRegion: (region) ->
      updater = App.updater

      updateView = @getUpdateView(updater)

      @show updateView, region: region

    bottomRegion: (region) ->
      bottomView = @getBottomView()

      @listenTo bottomView, "login:clicked", (view, obj) ->
        App.execute "login:request"

      @listenTo bottomView, "reload:clicked", ->
        App.execute "gui:reload"

      @listenTo bottomView, "console:clicked", ->
        App.execute "gui:console"

      @listenTo bottomView, "quit:clicked", ->
        App.execute "gui:quit"

      @listenTo bottomView, "updates:clicked", ->
        App.execute "gui:check:for:updates"
        # App.config.checkForUpdates()

      @show bottomView, region: region

    getLayoutView: ->
      new Show.Layout

    getUpdateView: ->
      new Show.Update

    getBottomView: ->
      new Show.Bottom