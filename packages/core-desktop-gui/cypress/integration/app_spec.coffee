{stubIpc, deferred} = require("../support/util")

describe "App", ->
  beforeEach ->
    cy
      .visit("/")

  context "window.onerror", ->
    beforeEach ->
      cy
        .window().then (win) ->
          {@App} = win
          cy.stub(@App, "ipc").as("ipc")

          stubIpc(@App.ipc, {
            "get:options": (stub) -> stub.resolves({})
            "get:current:user": (stub) -> stub.resolves(null)
          })

          @App.start()

    it "attaches to window.onerror", ->
      cy.window().then (win) ->
        cy.wrap(win.onerror).should("be.a", "function")

    it "attaches to window.onunhandledrejection", ->
      cy.window().then (win) ->
        cy.wrap(win.onunhandledrejection).should("be.a", "function")

    it "sends name, stack, message to gui:error on synchronous error", ->
      err = new Error("foo")

      cy.window().then (win) ->
        win.onerror(1, 2, 3, 4, err)

        expect(@App.ipc).to.be.calledWithExactly("gui:error", {
          name: "Error"
          message: "foo"
          stack: err.stack
        })

    it "sends name, stack, message to gui:error on unhandled rejection", ->
      err = new Error("foo")

      cy.window().then (win) ->
        win.foo = ->
          win.Promise.reject(err)

        setTimeout ->
          win.foo()
        , 0
      .wrap(@App.ipc).should("be.calledWithExactly", "gui:error", {
        name: "Error"
        message: "foo"
        stack: err.stack
      })

  context "on:menu:clicked", ->
    beforeEach ->
      cy
        .window().then (win) ->
          {@App} = win
          cy.stub(@App, "ipc").as("ipc")

          stubIpc(@App.ipc, {
            "get:options": (stub) -> stub.resolves({})
            "get:current:user": (stub) -> stub.resolves(null)
            "on:menu:clicked": ->
          })

          @onMenuClicked = @App.ipc.withArgs("on:menu:clicked")

          @App.start()

    it "calls log:out", ->
      @onMenuClicked.yield(null, "log:out")
      expect(@App.ipc).to.be.calledWith("log:out")

    it "checks for updates", ->
      @onMenuClicked.yield(null, "check:for:updates")
      expect(@App.ipc).to.be.calledWithExactly("window:open", {
        position: "center",
        width: 300,
        height: 240,
        toolbar: false,
        title: "Updates",
        type: "UPDATES",
      })

  context "on updates being applied", ->
    beforeEach ->
      cy
        .window().then (win) ->
          {@App} = win
          cy.stub(@App, "ipc").as("ipc")

          stubIpc(@App.ipc, {
            "get:options": (stub) -> stub.resolves({"updating": true})
          })

          @App.start()

    it "shows updates being applied view", ->
      cy
        .get("#login").contains("Applying updates")
        .get("img").should("have.attr", "src", "img/cypress-inverse.png")

  context "getting current user", ->
    beforeEach ->
      cy
        .window().then (win) ->
          {@App} = win
          cy.stub(@App, "ipc").as("ipc")

          @getCurrentUser = deferred()

          stubIpc(@App.ipc, {
            "get:options": (stub) -> stub.resolves({})
            "get:current:user": (stub) => stub.returns(@getCurrentUser.promise)
          })

          @App.start()

    it "requests current user", ->
      expect(@App.ipc).to.be.calledWith("get:current:user")

    it "redirects to login when no user", ->
      @getCurrentUser.resolve(null)
      cy.shouldBeOnLogin()

    it "redirects to login when user has no auth token", ->
      @getCurrentUser.resolve({})
      cy.shouldBeOnLogin()

    it "redirects to login when request 401s", ->
      @getCurrentUser.reject({ name: "", message: "", statusCode: 401 })
      cy.shouldBeOnLogin()
