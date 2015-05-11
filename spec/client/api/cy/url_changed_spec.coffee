describe "$Cypress Url:Changed Events", ->
  enterCommandTestingMode()

  describe "pageChanged", ->
    beforeEach ->
      @trigger = @sandbox.spy @Cypress, "trigger"

    it "triggers on page unload event", (done) ->
      ## when this finishes loading
      @cy.$remoteIframe.on "load", =>
        expect(@trigger).to.be.calledWith("page:loading", true)
        done()

      ## cause the unload event to fire
      @cy.$remoteIframe.prop("contentWindow").location.href = "about:blank"

    it "triggers after page load event", ->
      @cy.$remoteIframe.trigger("load")
      expect(@trigger).to.be.calledWith("page:loading", false)

  describe "urlChanged", ->
    beforeEach ->
      @trigger = @sandbox.spy @Cypress, "trigger"

    it "triggers url:changed", ->
      url     = "http://localhost:3000/app.html"
      @sandbox.stub(@cy.sync, "url").returns(url)
      @cy.urlChanged()
      expect(@trigger).to.be.calledWith "url:changed", url

    it "doesnt trigger if url is ''", ->
      ## this happens on about:blank
      @sandbox.stub(@cy.sync, "url").returns("")
      @cy.urlChanged()
      expect(@trigger).not.to.be.called

  describe "url:changed events", ->
    beforeEach ->
      @trigger = @sandbox.spy @Cypress, "trigger"
      @urlIs = (url) =>
        args =  _.filter @trigger.args, (arg) -> arg[0] is "url:changed"
        console.log JSON.stringify(args)
        expect(_.last(args)).to.deep.eq ["url:changed", url]

    context "load event", ->
      it "fires during load event", ->
        win = @cy.sync.window()
        @cy.$remoteIframe.trigger("load")
        @urlIs win.location.pathname

      it "fires when remote page finished loading", ->
        url = "http://getbootstrap.com/fixtures/html/generic.html"
        @cy.visit(url).then ->
          @urlIs url

      it "fires when the remote page is relative", ->
        url = "/fixtures/html/generic.html"
        @cy.visit(url).then ->
          @urlIs url

    context "cy.visit()", ->
      it "fires before resolving", ->
        url = "http://www.google.com/app"
        urlChanged = @sandbox.spy @cy, "urlChanged"
        cy.visit(url).then ->
          expect(urlChanged).to.be.calledWith url

    context "pushState events", ->
      it "fires when pushState is invoked", ->
        @cy
          .visit("fixtures/html/sinon.html")
          .get("#pushState").click()
          .then ->
            ## sinon.html has code which pushes
            ## the history to pushState.html
            @urlIs "/fixtures/html/pushState.html"

    context "hashchange events", ->
      it "fires on hashchange event", ->
        @cy
          .visit("fixtures/html/sinon.html")
          .get("#hashchange").click()
          .then ->
            @urlIs "/fixtures/html/sinon.html#hashchange"