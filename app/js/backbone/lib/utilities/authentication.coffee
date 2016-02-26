@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    loginRequest: ->
      App.ipc("window:open", {
        position: "center"
        focus: true
        width: 1000
        height: 635
        preload: false
        title: "Login"
        type: "GITHUB_LOGIN"
      })
      .then (code) ->
        ## TODO: supposed to focus the window here!
        ## i think this is for linux
        ## App.execute "gui:focus"

        # ## display logging in loading spinner here
        App.currentUser.loggingIn()

        ## now actually log in
        App.ipc("log:in", code)

      .then (user) ->
        App.currentUser.loggedIn(user)
        App.vent.trigger "start:projects:app"
      .catch (err) ->
        App.currentUser.setLoginError(err)
      .catch {alreadyOpen: true}, ->
        ## do nothing if we're already open!

    logOut: (user) ->
      ## immediately log out even before our
      ## promise resolves so we dont block the UI
      App.vent.trigger "start:login:app"

      App.ipc("log:out")
      .then ->
        App.ipc("clear:github:cookies")

  App.commands.setHandler "login:request", ->
    API.loginRequest()

  App.reqres.setHandler "current:user", ->
    App.currentUser or throw new Error("No current user set on App!")

  App.commands.setHandler "set:current:user", (attrs = {}) ->
    App.currentUser = App.request("new:user:entity", attrs)

  App.vent.on "log:out", (user) ->
    API.logOut(user)