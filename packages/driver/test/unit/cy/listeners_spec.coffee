{ $ } = window.testUtils

describe "$Cypress.Cy Listeners Extensions", ->
  context "iframe load", ->
    before ->
      @iframe = $("<iframe />").appendTo $("body")

    beforeEach ->
      @Cypress = $Cypress.create({loadModules: true})
      @cy = $Cypress.Cy.create(@Cypress, {})

      @Cypress.trigger "initialize", {
        $remoteIframe: @iframe
        config: {}
      }

      ## make sure not to accidentally return
      ## cy else mocha will queue up a .then()
      null

    after ->
      @iframe.remove()

    it "applies window listeners when an iframe fires its load event", ->
      bindWindowListeners = @sandbox.spy @cy, "bindWindowListeners"

      @iframe.trigger "load"

      expect(bindWindowListeners).to.be.calledOnce
      expect(bindWindowListeners).to.be.calledWith @iframe.prop("contentWindow")

  context "actual behaviors of events", ->
    enterCommandTestingMode()

    it "calls bindWindowListeners when remote window fires onBeforeLoad", ->
      ## ensure bindWindowListeners was called
      ## before onBeforeLoad
      bindWindowListeners = @sandbox.spy @cy, "bindWindowListeners"

      @cy.visit("http://localhost:3500/fixtures/sinon.html", {
        onBeforeLoad: (@contentWindow) =>
      }).then ->
        expect(bindWindowListeners).to.be.calledWith @contentWindow

    describe "beforeunload", ->
      beforeEach ->
        @isReady = @sandbox.spy @cy, "isReady"
        @a = $("<a id='change-page' href='/timeout?ms=200'>foo</a>").appendTo @cy.$$("body")

      it "sets isReady to false", ->
        ## when we click the a it should synchronously fire
        ## the beforeunload event which we then set isReady to false
        @cy.get("a#change-page").click().then ->
          expect(@isReady).to.be.calledWith false, "beforeunload"

      it "does not set isReady if beforeunload has a return value", ->
        ## stub this so the actual beforeunload prompt doesnt show up!
        @sandbox.stub(@cy, "_eventHasReturnValue").returns(true)

        ## when we click the a it should synchronously fire
        ## the beforeunload event which we then set isReady to false
        @cy.get("a#change-page").click().then ->
          expect(@isReady).not.to.be.calledWith false

      it "sets initial cookies", ->
        setInitial = @sandbox.stub @Cypress.Cookies, "setInitial"
        @cy.get("a#change-page").click().then ->
          expect(setInitial).to.be.called

      it "calls cy#loading", ->
        loading = @sandbox.stub @cy, "loading"
        @cy.get("a#change-page").click().then ->
          expect(loading).to.be.called
