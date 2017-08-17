{ _ } = window.testUtils

describe "$Cypress Url:Changed Events", ->
  enterCommandTestingMode()

  describe "pageChanged", ->
    beforeEach ->
      @trigger = @sandbox.spy @Cypress, "trigger"

    afterEach ->
      @loadDom("dom")

    it "triggers on page unload event", (done) ->
      ## when this finishes loading
      @cy.privateState("$remoteIframe").on "load", =>
        expect(@trigger).to.be.calledWith("page:loading", true)
        done()

      ## cause the unload event to fire
      @cy.privateState("$remoteIframe").prop("contentWindow").location.href = "about:blank"

    it "triggers after page load event", ->
      @cy.privateState("$remoteIframe").trigger("load")
      expect(@trigger).to.be.calledWith("page:loading", false)

  describe "urlChanged", ->
    beforeEach ->
      @trigger = @sandbox.spy @Cypress, "trigger"

    it "triggers url:changed", ->
      url     = "http://localhost:3000/app.html"
      @sandbox.stub(@cy, "_getLocation").returns(url)
      @cy.urlChanged()
      expect(@trigger).to.be.calledWith "url:changed", url

    it "doesnt trigger if url is ''", ->
      ## this happens on about:blank
      @sandbox.stub(@cy, "_getLocation").returns("")
      @cy.urlChanged()
      expect(@trigger).not.to.be.called

  describe "url:changed events", ->
    beforeEach ->
      @trigger = @sandbox.spy @Cypress, "trigger"

      @urlIs = (url) =>
        args =  _.filter @trigger.args, (arg) -> arg[0] is "url:changed"
        expect(_.last(args)).to.deep.eq ["url:changed", url]

    context "load event", ->
      it "fires during load event", ->
        win = @cy.privateState("window")
        @cy.privateState("$remoteIframe").trigger("load")
        @urlIs win.location.href

      it.skip "fires when remote page finished loading", ->
        url = "http://getbootstrap.com/fixtures/generic.html"
        @cy.visit(url).then ->
          @urlIs url

      it.skip "fires when the remote page is relative", ->
        url = "/fixtures/generic.html"
        @cy.visit(url).then ->
          @urlIs url

    ## cy.visit no longer fires urlChanged before
    ## resolving
    # context "cy.visit()", ->
    #   it "fires before resolving", ->
    #     url = "http://www.google.com/app"
    #     urlChanged = @sandbox.spy @cy, "urlChanged"
    #     cy.visit(url).then ->
    #       expect(urlChanged).to.be.calledWith url

    context "pushState events", ->
      it "fires when pushState is invoked", ->
        @cy
          .visit("http://localhost:3500/fixtures/sinon.html")
          .get("#pushState").click()
          .then ->
            ## sinon.html has code which pushes
            ## the history to pushState.html
            @urlIs "http://localhost:3500/fixtures/pushState.html"

    context "hashchange events", ->
      it "fires on hashchange event", ->
        @cy
          .visit("http://localhost:3500/fixtures/sinon.html")
          .get("#hashchange").click()
          .then ->
            @urlIs "http://localhost:3500/fixtures/sinon.html#hashchange"
