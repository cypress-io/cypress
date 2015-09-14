describe "$Cypress.Cy Local Storage Commands", ->
  enterCommandTestingMode()

  context "#clearLocalStorage", ->
    it "is defined", ->
      expect(@cy.clearLocalStorage).to.be.defined

    it "passes keys onto $Cypress.LocalStorage.clear", ->
      clear = @sandbox.spy $Cypress.LocalStorage, "clear"

      @cy.clearLocalStorage("foo").then ->
        expect(clear).to.be.calledWith "foo"

    it "sets the storages", ->
      localStorage = window.localStorage
      remoteStorage = @cy.private("window").localStorage

      setStorages = @sandbox.spy $Cypress.LocalStorage, "setStorages"

      @cy.clearLocalStorage().then ->
        expect(setStorages).to.be.calledWith localStorage, remoteStorage

    it "unsets the storages", ->
      unsetStorages = @sandbox.spy $Cypress.LocalStorage, "unsetStorages"

      @cy.clearLocalStorage().then ->
        expect(unsetStorages).to.be.called

    it "sets subject to remote localStorage", ->
      ls = @cy.private("window").localStorage

      @cy.clearLocalStorage().then (remote) ->
        expect(remote).to.eq ls

    describe "test:before:hooks", ->
      it "clears localStorage before each test run", ->
        clear = @sandbox.spy $Cypress.LocalStorage, "clear"
        @Cypress.trigger "test:before:hooks"
        expect(clear).to.be.calledWith []

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when being passed a non string or regexp", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.clearLocalStorage() must be called with either a string or regular expression!"
          done()

        @cy.clearLocalStorage({})

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "ends immediately", ->
        @cy.clearLocalStorage().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.clearLocalStorage().then ->
          expect(@log.get("snapshot")).to.be.an("object")
