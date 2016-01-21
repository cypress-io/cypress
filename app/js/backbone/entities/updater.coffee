@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Updater extends Entities.Model
    defaults: ->
      finished: false
      updatesAvailable: false

    mutators:
      stateFormatted: ->
        switch @get("state")
          when "checking"     then "Checking for updates..."
          when "downloading"  then "Downloading updates..."
          when "applying"     then "Applying updates..."
          when "done"         then "Updates ready!"
          when "none"         then "No updates available."
          when "error"        then "An error occurred updating."

      buttonFormatted: ->
        if @get("state") is "done" then "Restart" else "Close"

    setState: (state) ->
      switch state
        when "error", "done", "none" then @setFinished()

      @set "state", state

    setNewVersion: (newVersion) ->
      @set "newVersion", newVersion

    setFinished: ->
      @set "finished", true

    hasError: ->
      @get("state") is "error"

    isDone: ->
      @get("state") is "done"

    updatesAvailable: (bool = true) ->
      @set "updatesAvailable", bool

    check: ->
      App.ipc("updater:check").then (version) =>
        ## if we have a version then updates
        ## are available!
        if version
          @updatesAvailable()
        else
          @updatesAvailable(false)

    # setCoords: (coords = {}) ->
      # @getUpdater().setCoords(coords)

  API =
    newUpdater: (version) ->
      new Entities.Updater({version: version})

  App.reqres.setHandler "new:updater:entity", (version) ->
    API.newUpdater(version)