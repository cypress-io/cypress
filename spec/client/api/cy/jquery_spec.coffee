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
      @$parentNoWidth = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px;'>
            <span>child</span>
          </div>
        </div>"""

      @$parentNoHeight = add """
        <div style='width: 100px; height: 0px; overflow: hidden;'>
          <span>child</span>
        </div>"""

      @$parentWithWidthHeightNoOverflow = add """
        <div style='width: 100px; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px;'>
            <span>child</span>
          </div>
        </div>"""

      @$childPosAbs = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px;'>
            <span style='position: absolute;'>child</span>
          </div>
        </div>"""

      @$childPosFixed = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px;'>
            <span style='position: fixed;'>child</span>
          </div>
        </div>"""

      @$descendentPosAbs = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px; position: absolute;'>
            <span>child</span>
          </div>
        </div>"""

      @$descendentPosFixed = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px; position: fixed;'>
            <span>child</span>
          </div>
        </div>"""

      @$parentPosAbs = add """
        <div style='width: 0; height: 100px; overflow: hidden; position: absolute;'>
          <div style='height: 500px; width: 500px;'>
            <span>child</span>
          </div>
        </div>"""

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

    it "is hidden if parent has overflow: hidden and no width", ->
      expect(@$parentNoWidth.find("span")).to.be.hidden

    it "is hidden if parent has overflow: hidden and no height", ->
      expect(@$parentNoHeight.find("span")).to.be.hidden

    it "is visible when parent has positive dimensions even with overflow hidden", ->
      expect(@$parentWithWidthHeightNoOverflow.find("span")).to.be.visible

    it "is visible if child has position: absolute", ->
      expect(@$childPosAbs.find("span")).to.be.visible

    it "is visible if child has position: fixed", ->
      expect(@$childPosFixed.find("span")).to.be.visible

    it "is visible if descendent from parent has position: absolute", ->
      expect(@$descendentPosAbs.find("span")).to.be.visible

    it "is visible if descendent from parent has position: fixed", ->
      expect(@$descendentPosFixed.find("span")).to.be.visible

    it "is hidden if only the parent has position absolute", ->
      expect(@$parentPosAbs.find("span")).to.be.hidden