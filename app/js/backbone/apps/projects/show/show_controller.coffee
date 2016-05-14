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
        App.ipc("external:open", "https://docs.cypress.io")

      @listenTo @projectLayout, "host:info:clicked", ->
        App.ipc("external:open", "https://on.cypress.io")

      @listenTo @projectLayout, "run:browser:clicked", (browser) ->
        @launchBrowser(project, browser)

      @listenTo @projectLayout, "stop:clicked ok:clicked" , ->
        @closeProject().then ->
          App.vent.trigger "start:projects:app"

      @listenTo @projectLayout, "download:browser:clicked", ->
        App.ipc("external:open", "https://www.google.com/chrome/browser/")
        @closeProject().then ->
          App.vent.trigger "start:projects:app"

      @listenTo @projectLayout, "show", ->
        ## delay opening the project so
        ## we give the UI some time to render
        ## and not block due to sync require's
        ## in the main process
        _.delay =>
          @openProject(project)
        , 100

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

    reboot: (project) ->
      project.reset()

      @closeProject().then =>
        @openProject(project)

    closeProject: ->
      App.ipc.off("on:launch:browser")
      App.ipc.off("on:project:settings:change")
      App.ipc("close:project")

    openProject: (project) ->
      ## wait at least 750ms even if open:project
      ## resolves faster
      Promise.all([
        App.ipc("open:project", project.get("path")),
        Promise.delay(500)
      ])
      .spread (config) ->
        ## this will set the available browsers on the project
        project.setConfig(config)
      .then ->
        App.ipc("on:project:settings:change")
      .then =>
        @reboot(project)
      .catch (err) ->
        project.setError(err)

    getProjectLayout: (project) ->
      new Show.Project
        model: project
