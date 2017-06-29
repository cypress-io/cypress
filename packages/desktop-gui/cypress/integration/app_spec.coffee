describe "App", ->
  beforeEach ->
    cy.visitIndex().then (@win) ->
      { @start, @ipc } = @win.App

      cy.stub(@ipc, "getOptions").resolves({})
      cy.stub(@ipc, "getCurrentUser").resolves(null)
      cy.stub(@ipc, "onMenuClicked")
      cy.stub(@ipc, "guiError")

  context "window.onerror", ->
    beforeEach ->
      @start()

    it "attaches to window.onerror", ->
      cy.wrap(@win.onerror).should("be.a", "function")

    it "attaches to window.onunhandledrejection", ->
      cy.wrap(@win.onunhandledrejection).should("be.a", "function")

    it "sends name, stack, message to gui:error on synchronous error", ->
      err = new Error("foo")

      @win.onerror(1, 2, 3, 4, err)

      expect(@ipc.guiError).to.be.calledWithExactly({
        name: "Error"
        message: "foo"
        stack: err.stack
      })

    it "sends name, stack, message to gui:error on unhandled rejection", ->
      err = new Error("foo")

      @win.foo = =>
        @win.Promise.reject(err)

      setTimeout =>
        @win.foo()
      , 0

      cy.wrap({}).should ->
        expect(@ipc.guiError).to.be.calledWithExactly({
          name: "Error"
          message: "foo"
          stack: err.stack
        })

  context "on:menu:clicked", ->
    beforeEach ->
      cy.stub(@ipc, "logOut")

      @start()

    it "calls log:out", ->
      @ipc.onMenuClicked.yield(null, "log:out")
      expect(@ipc.logOut).to.be.called

  context "getting current user", ->
    beforeEach ->
      @getCurrentUser = @util.deferred()
      @ipc.getCurrentUser.resolves(@getCurrentUser.promise)

      @start()

    it "requests current user", ->
      cy.wrap({}).should ->
        expect(@ipc.getCurrentUser).to.be.called

    it "redirects to login when no user", ->
      @getCurrentUser.resolve(null)
      cy.shouldBeOnLogin()

    it "redirects to login when user has no auth token", ->
      @getCurrentUser.resolve({})
      cy.shouldBeOnLogin()

    it "redirects to login when request 401s", ->
      @getCurrentUser.reject({ name: "", message: "", statusCode: 401 })
      cy.shouldBeOnLogin()
