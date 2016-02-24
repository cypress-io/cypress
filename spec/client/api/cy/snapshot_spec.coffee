describe "$Cypress.Cy Snapshot Extension", ->
  enterCommandTestingMode()

  context "snapshot el", ->
    beforeEach ->
      @el = $("<span id='snapshot'>snapshot</span>").appendTo @cy.$$("body")

    it "does not clone iframes", ->
      iframe = $("<iframe id='test-iframe' />").appendTo(@cy.$$("body"))

      body = @Cypress.createSnapshot(@el)
      expect(body.find("iframe")).not.to.exist

    it "does not clone scripts", ->
      script = $("<script type='text/javascript' />").appendTo(@cy.$$("body"))

      body = @Cypress.createSnapshot(@el)
      expect(body.find("script")).not.to.exist

    it "does not clone css stylesheets", ->
      stylesheet = $("<link rel='stylesheet' />").appendTo(@cy.$$("body"))

      body = @Cypress.createSnapshot(@el)
      expect(body.find("link")).not.to.exist

    it "sets data-cypress-el attr", ->
      attr = @sandbox.spy @el, "attr"
      @Cypress.createSnapshot(@el)
      expect(attr).to.be.calledWith "data-cypress-el", true

    it "removes data-cypress-el attr", ->
      @Cypress.createSnapshot(@el)
      expect(@el.attr("data-cypress-el")).to.be.undefined
