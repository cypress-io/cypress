describe "$Cypress Url:Changed Events", ->
  enterCommandTestingMode()

  describe "urlChanged", ->
    it "triggers url:changed", ->
      url     = "http://localhost:3000/app.html"
      trigger = @sandbox.spy @Cypress, "trigger"
      @sandbox.stub(@cy.sync, "url").returns(url)
      @cy.urlChanged()
      expect(trigger).to.be.calledWith "url:changed", url

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