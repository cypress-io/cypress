describe "src/cy/commands/local_storage", ->
  context "#clearLocalStorage", ->
    it "passes keys onto Cypress.LocalStorage.clear", ->
      clear = cy.spy Cypress.LocalStorage, "clear"

      cy.clearLocalStorage("foo").then ->
        expect(clear).to.be.calledWith "foo"

    it "sets the storages", ->
      localStorage = window.localStorage
      remoteStorage = cy.state("window").localStorage

      setStorages = cy.spy Cypress.LocalStorage, "setStorages"

      cy.clearLocalStorage().then ->
        expect(setStorages).to.be.calledWith localStorage, remoteStorage

    it "unsets the storages", ->
      unsetStorages = cy.spy Cypress.LocalStorage, "unsetStorages"

      cy.clearLocalStorage().then ->
        expect(unsetStorages).to.be.called

    it "sets subject to remote localStorage", ->
      ls = cy.state("window").localStorage

      cy.clearLocalStorage().then (remote) ->
        expect(remote).to.eq ls

    describe "test:run:start", ->
      it "clears localStorage before each test run", ->
        clear = cy.spy Cypress.LocalStorage, "clear"

        Cypress.emit("test:run:start", {})

        expect(clear).to.be.calledWith []

    describe "errors", ->
      it "throws when being passed a non string or regexp", (done) ->
        cy.on "test:fail", (err) ->
          expect(err.message).to.include "cy.clearLocalStorage() must be called with either a string or regular expression."
          done()

        cy.clearLocalStorage({})

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          @lastLog = log

        return null

      it "ends immediately", ->
        cy.clearLocalStorage().then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        cy.clearLocalStorage().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
