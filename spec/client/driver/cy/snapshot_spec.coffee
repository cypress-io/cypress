describe "$Cypress.Cy Snapshot Extension", ->
  enterCommandTestingMode()

  context "snapshot el", ->
    beforeEach ->
      @el = $("<span id='snapshot'>snapshot</span>").appendTo @cy.$$("body")

    it "does not clone iframes", ->
      $("<iframe id='test-iframe' />").appendTo(@cy.$$("body"))

      body = @Cypress.createSnapshot(@el)
      expect(body.find("iframe")).not.to.exist

    it "does not clone scripts", ->
      $("<script type='text/javascript' />").appendTo(@cy.$$("body"))

      body = @Cypress.createSnapshot(@el)
      expect(body.find("script")).not.to.exist

    it "does not clone css stylesheets", ->
      $("<link rel='stylesheet' />").appendTo(@cy.$$("body"))

      body = @Cypress.createSnapshot(@el)
      expect(body.find("link")).not.to.exist

    it "clones styles from head and body into single <style /> in body", ->
      $("<style>body { background: red; }</style>").appendTo(@cy.$$("head"))
      $("<style>body { color: blue }</style>").appendTo(@cy.$$("body"))

      style = @Cypress.createSnapshot(@el).find("style")
      expect(style.length).to.equal(1)
      expect(style.text()).to.contain("body { background: red; }")
      expect(style.text()).to.contain("body { color: blue; }")

    it "sets data-cypress-el attr", ->
      attr = @sandbox.spy @el, "attr"
      @Cypress.createSnapshot(@el)
      expect(attr).to.be.calledWith "data-cypress-el", true

    it "removes data-cypress-el attr", ->
      @Cypress.createSnapshot(@el)
      expect(@el.attr("data-cypress-el")).to.be.undefined
