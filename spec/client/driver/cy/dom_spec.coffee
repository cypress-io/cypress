describe "$Cypress.jQuery Extensions", ->
  enterCommandTestingMode()

  it "attaches to Cypress namespace", ->
    expect($Cypress.Dom).to.be.an("object")
    expect(Cypress.Dom).to.be.an("object")

  context "isHidden", ->
    it "exposes isHidden", ->
      expect($Cypress.Dom.isHidden).to.be.a("function")
      expect(Cypress.Dom.isHidden).to.be.a("function")

    it "throws when not passed a DOM element", ->
      fn = ->
        $Cypress.Dom.isHidden(null)

      expect(fn).to.throw("$Cypress.Dom.isHidden() must be passed a basic DOM element. You passed: 'null'")

  context "isVisible", ->
    it "exposes isVisible", ->
      expect($Cypress.Dom.isVisible).to.be.a("function")
      expect(Cypress.Dom.isVisible).to.be.a("function")

    it "throws when not passed a DOM element", ->
      fn = ->
        $Cypress.Dom.isVisible(null)

      expect(fn).to.throw("$Cypress.Dom.isVisible() must be passed a basic DOM element. You passed: 'null'")

  context "hidden/visible overrides", ->
    beforeEach ->
      add = (el) =>
        $(el).appendTo(@cy.$$("body"))

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
          <div style='height: 100px; width: 100px;'>
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

      @$elOutOfParentBoundsToLeft = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: -100px; top: 0px;'>child</span>
        </div>
      """

      @$elOutOfParentBoundsToRight = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 200px; top: 0px;'>child</span>
        </div>
      """

      @$elOutOfParentBoundsAbove = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 0px; top: -100px;'>child</span>
        </div>
      """

      @$elOutOfParentBoundsBelow = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 0px; top: 200px;'>child</span>
        </div>
      """

      @$elInPosAbsParentsBounds = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative; top: 700px; left: 700px;'>
          <div style='position: absolute;'>
            <div style='position: absolute;'>
              <span style='position: absolute; left: 50px; top: 50px;'>child</span>
            </div>
          </div>
        </div>
      """

      @$elOutOfPosAbsParentsBounds = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative; top: 700px; left: 700px;'>
          <div style='position: absolute;'>
            <div style='position: absolute;'>
              <span style='position: absolute; left: -300px; top: 0px;'>child</span>
            </div>
          </div>
        </div>
      """

      @$elInParentBounds = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 0px; top: 0px;'>child</span>
        </div>
      """

      @$elOutOfScrollingParentBounds = add """
        <div style='width: 100px; height: 100px; overflow: scroll; position: relative; top: 700px; left: 700px;'>
          <div style='position: absolute;'>
            <div style='position: absolute;'>
              <span style='position: absolute; left: 300px; top: 0px;'>child</span>
            </div>
          </div>
        </div>
      """

    it "is hidden if .css(visibility) is hidden", ->
      expect(@$visHidden.is(":hidden")).to.be.true
      expect(@$visHidden.is(":visible")).to.be.false

      expect(@$visHidden).to.be.hidden
      expect(@$visHidden).to.not.be.visible

      cy.wrap(@$visHidden).should("be.hidden")
      cy.wrap(@$visHidden).should("not.be.visible")

    it "is hidden if parents have .css(visibility) hidden", ->
      expect(@$parentVisHidden.find("button").is(":hidden")).to.be.true
      expect(@$parentVisHidden.find("button").is(":visible")).to.be.false

      expect(@$parentVisHidden.find("button")).to.be.hidden
      expect(@$parentVisHidden.find("button")).to.not.be.visible

      cy.wrap(@$parentVisHidden).find("button").should("be.hidden")
      cy.wrap(@$parentVisHidden).find("button").should("not.be.visible")

    it "is visible if opacity is 0", ->
      expect(@$btnOpacity.is(":hidden")).to.be.false
      expect(@$btnOpacity.is(":visible")).to.be.true

      expect(@$btnOpacity).not.to.be.hidden
      expect(@$btnOpacity).to.be.visible

      cy.wrap(@$btnOpacity).should("not.be.hidden")
      cy.wrap(@$btnOpacity).should("be.visible")

    it "is hidden if offsetWidth is 0", ->
      expect(@$divNoWidth.is(":hidden")).to.be.true
      expect(@$divNoWidth.is(":visible")).to.be.false

      expect(@$divNoWidth).to.be.hidden
      expect(@$divNoWidth).to.not.be.visible

      cy.wrap(@$divNoWidth).should("be.hidden")
      cy.wrap(@$divNoWidth).should("not.be.visible")

    it "is hidden if parent has overflow: hidden and no width", ->
      expect(@$parentNoWidth.find("span")).to.be.hidden
      expect(@$parentNoWidth.find("span")).to.not.be.visible

    it "is hidden if parent has overflow: hidden and no height", ->
      expect(@$parentNoHeight.find("span")).to.be.hidden
      expect(@$parentNoHeight.find("span")).to.not.be.visible

    it "is visible when parent has positive dimensions even with overflow hidden", ->
      expect(@$parentWithWidthHeightNoOverflow.find("span")).to.be.visible
      expect(@$parentWithWidthHeightNoOverflow.find("span")).to.not.be.hidden

    it "is visible if child has position: absolute", ->
      expect(@$childPosAbs.find("span")).to.be.visible
      expect(@$childPosAbs.find("span")).not.be.hidden

    it "is visible if child has position: fixed", ->
      expect(@$childPosFixed.find("span")).to.be.visible
      expect(@$childPosFixed.find("span")).to.not.be.hidden

    it "is visible if descendent from parent has position: absolute", ->
      expect(@$descendentPosAbs.find("span")).to.be.visible
      expect(@$descendentPosAbs.find("span")).to.not.be.hidden

    it "is visible if descendent from parent has position: fixed", ->
      expect(@$descendentPosFixed.find("span")).to.be.visible
      expect(@$descendentPosFixed.find("span")).to.not.be.hidden

    it "is hidden if only the parent has position absolute", ->
      expect(@$parentPosAbs.find("span")).to.be.hidden
      expect(@$parentPosAbs.find("span")).to.not.be.visible

    it "is visible when parent doesnt have overflow hidden", ->
      expect(@$parentNoWidthHeightOverflowAuto.find("span")).to.be.visible
      expect(@$parentNoWidthHeightOverflowAuto.find("span")).to.not.be.hidden

    it "is hidden when parent overflow hidden and out of bounds to left", ->
      expect(@$elOutOfParentBoundsToLeft.find("span")).to.be.hidden

    it "is hidden when parent overflow hidden and out of bounds to right", ->
      expect(@$elOutOfParentBoundsToRight.find("span")).to.be.hidden

    it "is hidden when parent overflow hidden and out of bounds above", ->
      expect(@$elOutOfParentBoundsAbove.find("span")).to.be.hidden

    it "is hidden when parent overflow hidden and out of bounds below", ->
      expect(@$elOutOfParentBoundsBelow.find("span")).to.be.hidden

    it "is hidden when parent pos abs & overflow hidden and out of bounds", ->
      expect(@$elOutOfPosAbsParentsBounds.find("span")).to.be.hidden

    it "is hidden when parent overflow scroll and out of bounds", ->
      expect(@$elOutOfScrollingParentBounds.find("span")).to.be.hidden

    it "is visible when parent abs positioned and overflow hidden and not out of bounds", ->
      expect(@$elInPosAbsParentsBounds.find("span")).to.be.visible

    it "is visible when parent overflow hidden and not out of bounds", ->
      expect(@$elInParentBounds.find("span")).to.be.visible

    describe "#getReasonElIsHidden", ->
      beforeEach ->
        @reasonIs = ($el, str) ->
          expect($Cypress.Dom.getReasonElIsHidden($el)).to.eq(str)

      it "has 'display: none'", ->
        @reasonIs @$displayNone, "This element: <button> is not visible because it has CSS property: 'display: none'"

      it "has a parent with 'display: none'", ->
        @reasonIs @$parentDisplayNone.find("span"), "This element: <span> is not visible because it's parent: <div#none> has CSS property: 'display: none'"

      it "has 'visibility: hidden'", ->
        @reasonIs @$visHidden, "This element: <ul> is not visible because it has CSS property: 'visibility: hidden'"

      it "has parent with 'visibility: hidden'", ->
        @reasonIs @$parentVisHidden.find("button"), "This element: <button> is not visible because it's parent: <div.invis> has CSS property: 'visibility: hidden'"

      it "has effective zero width", ->
        @reasonIs @$divNoWidth, "This element: <div> is not visible because it has an effective width and height of: '0 x 100' pixels."

      it "has effective zero height", ->
        @reasonIs @$divNoHeight, "This element: <div> is not visible because it has an effective width and height of: '50 x 0' pixels."

      it "has a parent with an effective zero width and overflow: hidden", ->
        @reasonIs @$parentNoHeight.find("span"), "This element: <span> is not visible because it's parent: <div> has CSS property: 'overflow: hidden' and an effective width and height of: '100 x 0' pixels."

      it "element sits outside boundaries of parent with overflow clipping", ->
        @reasonIs @$elOutOfParentBoundsToRight.find("span"), "This element: <span> is not visible because it\'s content is being clipped by one of it\'s parent elements, which has a CSS property of overflow: \'hidden\', \'scroll\' or \'auto\'"

      it "cannot determine why element is not visible", ->
        @reasonIs @$btnOpacity, "Cypress could not determine why this element: <button> is not visible."
