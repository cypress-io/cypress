describe "$Cypress.jQuery Extensions", ->
  enterCommandTestingMode()

  it "attaches to Cypress namespace", ->
    expect($Cypress.JQuery).to.be.an("object")
    expect(Cypress.JQuery).to.be.an("object")

  context "hidden overrides", ->
    beforeEach ->
      add = (el) =>
        $(el).appendTo(@cy.$("body"))

      @$visHidden  = add "<ul style='visibility: hidden;'></ul>"
      @$parentVisHidden = add "<div class='invis' style='visibility: hidden;'><button>foo</button></div>"
      @$displayNone = add "<button style='display: none'>none</button>"
      @$btnOpacity = add "<button style='opacity: 0'>opacity</button>"
      @$divNoWidth = add "<div style='width: 0; height: 100px;'>foo</div>"
      @$divNoHeight = add "<div style='width: 50px; height: 0px;'>bar</div>"
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

      @$parentNoWidthHeightOverflowAuto = add """
        <div style='width: 0; height: 0px; overflow: auto;'>
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

      @$parentDisplayNone = add """
        <div id="none" style='display: none;'>
          <span>child</span>
        </div>
        """

    it "is hidden if .css(visibility) is hidden", ->
      expect(@$visHidden.is(":hidden")).to.be.true
      expect(@$visHidden).to.be.hidden
      cy.wrap(@$visHidden).should("be.hidden")

    it "is hidden if parents have .css(visibility) hidden", ->
      expect(@$parentVisHidden.find("button").is(":hidden")).to.be.true
      expect(@$parentVisHidden.find("button")).to.be.hidden
      cy.wrap(@$parentVisHidden).find("button").should("be.hidden")

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

    it "is visible when parent doesnt have overflow hidden", ->
      expect(@$parentNoWidthHeightOverflowAuto.find("span")).to.be.visible

    describe "#getReasonElIsHidden", ->
      beforeEach ->
        @reasonIs = ($el, str) ->
          expect($Cypress.JQuery.getReasonElIsHidden($el)).to.eq(str)

      it "has 'display: none'", ->
        @reasonIs @$displayNone, "This element is not visible because it has CSS property: 'display: none'"

      it "has a parent with 'display: none'", ->
        @reasonIs @$parentDisplayNone.find("span"), "This element is not visible because it has parent <div#none> with CSS property: 'display: none'"

      it "has 'visibility: hidden'", ->
        @reasonIs @$visHidden, "This element is not visible because it has CSS property: 'visibility: hidden'"

      it "has parent with 'visibility: hidden'", ->
        @reasonIs @$parentVisHidden.find("button"), "This element is not visible because it has parent <div.invis> with CSS property: 'visibility: hidden'"

      it "has effective zero width", ->
        @reasonIs @$divNoWidth, "This element is not visible because it has an effective width and height of: '0 x 100' pixels."

      it "has effective zero height", ->
        @reasonIs @$divNoHeight, "This element is not visible because it has an effective width and height of: '50 x 0' pixels."

      it "has a parent when an effective zero width and overflow: hidden", ->
        @reasonIs @$parentNoHeight.find("span"), "This element is not visible because it has parent <div> with CSS property: 'overflow: hidden' and an effective width and height of: '100 x 0' pixels."

      it "cannot determine why element is not visible", ->
        @reasonIs @$btnOpacity, "Cypress could not determine why this element is not visible."
