@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (params) ->
      { project } = params

      @projectLayout = @getProjectLayout(project)

      ## when we are notified by the server to launch
      ## a browser we will do so!
      App.ipc "on:launch:browser", (err, data = {}) =>
        {browser, url} = data
        @launchBrowser(project, browser, url)

      @listenTo @projectLayout, "help:clicked", ->
        App.ipc("external:open", "https://on.cypress.io")

      @listenTo @projectLayout, "host:info:clicked", ->
        App.ipc("external:open", "https://on.cypress.io")

      @listenTo @projectLayout, "run:browser:clicked", (browser) ->
        @launchBrowser(project, browser)

      @listenTo @projectLayout, "stop:clicked ok:clicked download:browser:clicked" , ->
        @closeProject().then ->
          App.vent.trigger "start:projects:app"

      @listenTo @projectLayout, "download:browser:clicked", ->
        App.ipc("external:open", "https://www.google.com/chrome/browser/")

      @listenTo @projectLayout, "show", ->
        ## delay opening the project so
        ## we give the UI some time to render
        ## and not block due to sync require's
        ## in the main process
        Promise
        .delay(100)
        .then =>
          @openProject(project)
          .spread (config) ->
            ## this will set the available browsers on the project
            project.setConfig(config)
          .then =>
            ## create a promise which listens for
            ## project settings change events
            ## and updates our project model
            do listenToProjectSettingsChange = =>
              App.ipc("on:project:settings:change")
              .then (data = {}) =>
                project.reset()
                project.setConfig(data.config)
                project.trigger("rebooted")

                ## if we had an open browser
                ## then launch it again!
                if b = data.browser
                  @launchBrowser(project, b)

                ## recursively listen for more
                ## change events!
                listenToProjectSettingsChange()
          .catch (err) ->
            project.setError(err)

      @show @projectLayout

    launchBrowser: (project, browser, url) ->
      ## here's where you write logic to open the url
      ## in a specific browser
      project.setBrowser(browser)
      project.browserOpening()

      App.ipc "launch:browser", {browser, url}, (err, data = {}) ->
        switch
          when data.browserOpened
            project.browserOpened()

          when data.browserClosed
            App.ipc.off("launch:browser")
            project.browserClosed()

    closeProject: ->
      App.ipc.off("on:launch:browser")
      App.ipc("close:project")

    openProject: (project) ->
      ## wait at least 750ms even if open:project
      ## resolves faster
      Promise.all([
        App.ipc("open:project", project.get("path")),
        Promise.delay(500)
      ])

    getProjectLayout: (project) ->
      new Show.Project
        model: project
