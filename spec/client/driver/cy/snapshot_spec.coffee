describe "$Cypress.Cy Snapshot Extension", ->
  enterCommandTestingMode()

  context "snapshot el", ->
    beforeEach ->
      @el = $("<span id='snapshot'>snapshot</span>").appendTo @cy.$$("body")

    it "does not clone scripts", ->
      $("<script type='text/javascript' />").appendTo(@cy.$$("body"))

      {body} = @Cypress.createSnapshot(@el)
      expect(body.find("script")).not.to.exist

    it "does not clone css stylesheets", ->
      $("<link rel='stylesheet' />").appendTo(@cy.$$("body"))

      {body} = @Cypress.createSnapshot(@el)
      expect(body.find("link")).not.to.exist

    it "clones styles from head and body into single <style /> in body", ->
      $("<style>body { background: red; }</style>").appendTo(@cy.$$("head"))
      $("<style>body { color: blue }</style>").appendTo(@cy.$$("body"))

      style = @Cypress.createSnapshot(@el).body.find("style")
      expect(style.length).to.equal(1)
      expect(style.text()).to.contain("body { background: red; }")
      expect(style.text()).to.contain("body { color: blue; }")

    it "preserves styles on the <html> tag", ->
      @cy.$$("html").addClass("foo bar")

      {htmlClasses} = @Cypress.createSnapshot(@el)
      expect(htmlClasses).to.equal("foo bar")

    it "sets data-cypress-el attr", ->
      attr = @sandbox.spy @el, "attr"
      @Cypress.createSnapshot(@el)
      expect(attr).to.be.calledWith "data-cypress-el", true

    it "removes data-cypress-el attr", ->
      @Cypress.createSnapshot(@el)
      expect(@el.attr("data-cypress-el")).to.be.undefined

    context "iframes", ->

      it "replaces with placeholders that have src in content", ->
        $("<iframe src='generic.html' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe").length).to.equal(1)
        expect(body.find("iframe")[0].src).to.include("generic.html")

      it "placeholders have same id", ->
        $("<iframe id='foo-bar' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe")[0].id).to.equal("foo-bar")

      it "placeholders have same classes", ->
        $("<iframe class='foo bar' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe")[0].className).to.equal("foo bar")

      it "placeholders have inline styles", ->
        $("<iframe style='margin: 40px' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe").css("margin")).to.equal("40px")

      it "placeholders have width set to outer width", ->
        $("<iframe style='width: 40px; padding: 20px; border: solid 5px' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe").css("width")).to.equal("90px")

      it "placeholders have height set to outer height", ->
        $("<iframe style='height: 40px; padding: 10px; border: solid 5px' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe").css("height")).to.equal("70px")
