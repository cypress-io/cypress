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

      check = ->
        updater.check()

      updateView = @getUpdateView(updater)

      @listenTo updateView, "show", ->
        ## check for updates every 5 minutes
        @checkId = setInterval check, (5 * 60 * 1000)
        check()

      @listenTo updateView, "strong:clicked", ->
        App.execute "gui:check:for:updates"

      @show updateView, region: region

    onDestroy: ->
      ## make sure we clear the constant checking
      ## when our controller is nuked (if ever)
      clearInterval(@checkId)

    bottomRegion: (region) ->
      bottomView = @getBottomView()

      @listenTo bottomView, "tests:clicked", ->
        App.execute "gui:tests"

      @listenTo bottomView, "login:clicked", (view, obj) ->
        App.execute "login:request"

      @listenTo bottomView, "quit:clicked", ->
        ## TODO: handle quiting
        App.execute "gui:quit"

      @listenTo bottomView, "updates:clicked", ->
        App.execute "gui:check:for:updates"
        # App.config.checkForUpdates()

      @listenTo bottomView, "debug:clicked", ->
        App.execute "gui:debug"

      @listenTo bottomView, "about:clicked", ->
        App.execute "gui:about"

      @listenTo bottomView, "preferences:clicked", ->
        App.execute "gui:preferences"

      @show bottomView, region: region

    getLayoutView: ->
      new Show.Layout

    getUpdateView: (updater) ->
      new Show.Update
        model: updater

    getBottomView: ->
      new Show.Bottom