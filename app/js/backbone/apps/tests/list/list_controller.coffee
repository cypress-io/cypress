@App.module "TestsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: ->
      files  = App.request "file:entities"
      socket = App.request "socket:entity"
      config = App.request "app:config:entity"

      @layout = @getLayoutView(config)

      ## if this is our first time visiting files
      ## after adding the project, we want to onboard
      @listenTo @layout, "show", ->
        socket.emit "is:new:project", (bool) ->
          files.trigger("is:new:project", bool)

      @listenTo @layout, "project:name:clicked", ->
        socket.emit "open:finder", config.get("parentTestsFolder")

      @listenTo files, "is:new:project", (bool) ->
        @onboardingRegion() if bool

      @listenTo files, "sync", =>
        # @searchRegion(files) if files.length
        # @recentFilesRegion(files)
        @filesRegion(files, config)

      @show @layout,
        loading:
          entities: files

    onboardingRegion: ->
      App.execute "show:files:onboarding"

    searchRegion: (files) ->
      searchView = @getSearchView files

      @show searchView,
        region: @layout.searchRegion

    recentFilesRegion: (files) ->
      recentFilesView = @getRecentFilesView files

      @show recentFilesView,
        region: @layout.recentFilesRegion

    filesRegion: (files, config) ->
      config.set("resolved", {
        port: { value: 2121, from: 'cli' },
        reporter: { value: true, from: 'config' },
        baseUrl: { value: 'http://localhost:8080', from: 'config' },
        commandTimeout: { value: 4000, from: 'default' },
        pageLoadTimeout: { value: 30000, from: 'default' },
        requestTimeout: { value: 5000, from: 'default' },
        responseTimeout: { value: 20000, from: 'default' },
        waitForAnimations: { value: true, from: 'default' },
        animationDistanceThreshold: { value: 5, from: 'default' },
        watchForFileChanges: { value: true, from: 'default' },
        viewportWidth: { value: 1000, from: 'default' },
        viewportHeight: { value: 660, from: 'default' },
        fileServerFolder: { value: '', from: 'default' },
        supportFolder: { value: 'cypress/support', from: 'default' },
        fixturesFolder: { value: 'cypress/fixtures', from: 'default' },
        integrationFolder: { value: 'cypress/integration', from: 'default' },
        environmentVariables: {
          foo: { value: 'foo', from: 'env' },
          bar: { value: 'bar', from: 'envFile' },
          baz: { value: 'baz', from: 'cli'}
        }
      })

      files.resetToTreeView()

      files.prependWithAllTests() if files.length

      filesView = @getFilesView files, config

      @show filesView,
        region: @layout.allFilesRegion

    getLayoutView: (config) ->
      new List.Layout
        model: config

    getSearchView: (files) ->
      new List.Search
        collection: files

    getRecentFilesView: (files) ->
      new List.RecentFiles
        collection: files

    getFilesView: (files, config) ->
      new List.Files
        collection: files
        config: config
