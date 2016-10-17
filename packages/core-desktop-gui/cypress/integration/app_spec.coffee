describe "App", ->
  beforeEach ->
    cy
      .visit("/")

  context "window.onerror", ->
    beforeEach ->
      cy
        .window().then (win) ->
          {@ipc, @App} = win

          @agents = cy.agents()
          @agents.spy(@App, "ipc")

          @ipc.handle("get:options", null, {})

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
          new win.Promise (resolve, reject) ->
            reject(err)

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
          {@ipc, @App} = win

          @agents = cy.agents()
          @agents.spy(@App, "ipc")

          @ipc.handle("get:options", null, {})

    it "calls log:out", ->
      @ipc.handle("on:menu:clicked", null, "log:out")
      expect(@App.ipc).to.be.calledWith("log:out")

    it "checks for updates", ->
      @ipc.handle("on:menu:clicked", null, 'check:for:updates')
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
          {@ipc, @App} = win

          @agents = cy.agents()
          @agents.spy(@App, "ipc")

          @ipc.handle("get:options", null, {"updating": true})

    it "shows updates being applied view", ->
      cy
        .get("#login").contains("Applying updates")
        .get("img").should("have.attr", "src", "img/cypress-inverse.png")
