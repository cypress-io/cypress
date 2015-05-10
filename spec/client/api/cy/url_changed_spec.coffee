describe "$Cypress Url:Changed Events", ->
  enterCommandTestingMode()

  # describe "urlChanged", ->
  #   it "triggers url:changed", ->
  #     trigger = @sandbox.spy @Cypress, "trigger"
  #     @Cypress.urlChanged "http://localhost:3000"
  #     expect(trigger).to.be.calledWith "url:changed", "http://localhost:3000"

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