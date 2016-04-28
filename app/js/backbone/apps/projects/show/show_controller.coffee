@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Controller extends App.Controllers.Application

    initialize: (params) ->
      { project } = params

      browsers = App.request "browser:entities"

      @projectLayout = @getProjectLayout(project, browsers)

      @listenTo @projectLayout, "host:info:clicked", ->
        App.ipc("external:open", "https://on.cypress.io")

      @listenTo @projectLayout, "run:browser:clicked", (browser) ->
        ## here's where you write logic to open the url
        ## in a specific browser

        # App.ipc("", project.get("clientUrl"), browser)

      @listenTo @projectLayout, "stop:clicked ok:clicked" , ->
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

      @listenTo browsers, "fetched", ->
        defaultBrowser = browsers.pullOffDefaultBrowser()
        project.set({defaultBrowser: defaultBrowser})
        @show @projectLayout

    reboot: (project) ->
      project.reset()

      @closeProject().then =>
        @openProject(project)

    closeProject: ->
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
        project.setClientUrl(config.clientUrl, config.clientUrlDisplay)
      .then ->
        App.ipc("on:project:settings:change")
      .then =>
        @reboot(project)
      .catch (err) ->
        project.setError(err)

    getProjectLayout: (project, browsers) ->
      new Show.Project
        model: project
        collection: browsers