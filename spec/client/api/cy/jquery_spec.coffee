describe "$Cypress.Cy jQuery Extensions", ->
  enterCommandTestingMode()

  describe "hidden overrides", ->
    beforeEach ->
      add = (el) =>
        $(el).appendTo(@cy.$("body"))

      @$ul  = add "<ul style='visibility: hidden;'></ul>"
      @$div = add "<div style='visibility: hidden;'><button>foo</button></div>"
      @$btnOpacity = add "<button style='opacity: 0'>opacity</button>"
      @$divNoWidth = add "<div style='width: 0; height: 100px;'>foo</div>"

    it "is hidden if .css(visibility) is hidden", ->
      expect(@$ul.is(":hidden")).to.be.true
      expect(@$ul).to.be.hidden
      cy.wrap(@$ul).should("be.hidden")

    it "is hidden if parents have .css(visibility) hidden", ->
      expect(@$div.find("button").is(":hidden")).to.be.true
      expect(@$div.find("button")).to.be.hidden
      cy.wrap(@$div).find("button").should("be.hidden")

    it "is visible if opacity is 0", ->
      expect(@$btnOpacity.is(":hidden")).to.be.false
      expect(@$btnOpacity).not.to.be.hidden
      cy.wrap(@$btnOpacity).should("not.be.hidden")

    it "is hidden if offsetWidth is 0", ->
      expect(@$divNoWidth.is(":hidden")).to.be.true
      expect(@$divNoWidth).to.be.hidden
      cy.wrap(@$divNoWidth).should("be.hidden")