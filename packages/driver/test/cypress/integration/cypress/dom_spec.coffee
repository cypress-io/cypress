$dom = Cypress.dom
$ = Cypress.$.bind(Cypress)

describe "src/cypress/dom", ->
  beforeEach ->
    cy.visit("/fixtures/generic.html")

  it "attaches to Cypress namespace", ->
    expect($dom).to.be.an("object")

  context "isHidden", ->
    it "exposes isHidden", ->
      expect($dom.isHidden).to.be.a("function")

    it "throws when not passed a DOM element", ->
      fn = ->
        $dom.isHidden(null)

      expect(fn).to.throw("Cypress.dom.isHidden() must be passed a basic DOM element. You passed: 'null'")

  context "isVisible", ->
    it "exposes isVisible", ->
      expect($dom.isVisible).to.be.a("function")

    it "throws when not passed a DOM element", ->
      fn = ->
        $dom.isVisible(null)

      expect(fn).to.throw("Cypress.dom.isVisible() must be passed a basic DOM element. You passed: 'null'")

  context "#elIsScrollable", ->
    beforeEach ->
      @add = (el) =>
        $(el).appendTo(cy.$$("body"))

    it "returns true if window and body > window height", ->
      @add("<div style='height: 1000px;' />")
      win = cy.state("window")

      fn = => $dom.elIsScrollable(win)

      expect(fn()).to.be.true

    it "returns false window and body > window height", ->

      cy.$$("body").html("<div>foo</div>")

      win = cy.state("window")

      fn = -> $dom.elIsScrollable(win)

      expect(fn()).to.be.false

    it "returns false el is not scrollable", ->
      noScroll = @add """
        <div style="height: 100px; overflow: auto;">
          <div>No Scroll</div>
        </div>
        """

      fn = => $dom.elIsScrollable(noScroll)

      expect(fn()).to.be.false

    it "returns false el has no overflow", ->
      noOverflow = @add """
        <div style="height: 100px; width: 100px; border: 1px solid green;">
          <div style="height: 150px;">
            No Overflow Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Etiam porta sem malesuada magna mollis euismod.
          </div>
        </div>
        """

      fn = => $dom.elIsScrollable(noOverflow)

      expect(fn()).to.be.false

    it "returns true when vertically scrollable", ->
      vertScrollable = @add """
        <div style="height: 100px; width: 100px; overflow: auto;">
          <div style="height: 150px;">Vertical Scroll</div>
        </div>
      """

      fn = => $dom.elIsScrollable(vertScrollable)

      expect(fn()).to.be.true

    it "returns true when horizontal scrollable", ->
      horizScrollable = @add """
        <div style="height: 100px; width: 100px; overflow: auto; ">
          <div style="height: 150px;">Horizontal Scroll</div>
        </div>
      """

      fn = => $dom.elIsScrollable(horizScrollable)

      expect(fn()).to.be.true

    it "returns true when overflow scroll forced and content larger", ->
      forcedScroll = @add """
        <div style="height: 100px; width: 100px; overflow: scroll; border: 1px solid yellow;">
          <div style="height: 300px; width: 300px;">Forced Scroll</div>
        </div>
      """

      fn = => $dom.elIsScrollable(forcedScroll)

      expect(fn()).to.be.true

  context "hidden/visible overrides", ->
    beforeEach ->
      add = (el) =>
        $(el).appendTo(cy.$$("body"))

      @$visHidden  = add "<ul style='visibility: hidden;'></ul>"
      @$parentVisHidden = add "<div class='invis' style='visibility: hidden;'><button>parent visibility: hidden</button></div>"
      @$displayNone = add "<button style='display: none'>display: none</button>"
      @$btnOpacity = add "<button style='opacity: 0'>opacity: 0</button>"
      @$divNoWidth = add "<div style='width: 0; height: 100px;'>width: 0</div>"
      @$divNoHeight = add "<div style='width: 50px; height: 0px;'>height: 0</div>"
      @$parentNoWidth = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px;'>
            <span>parent width: 0</span>
          </div>
        </div>"""

      @$parentNoHeight = add """
        <div style='width: 100px; height: 0px; overflow: hidden;'>
          <span>parent height: 0</span>
        </div>"""

      @$parentNoWidthHeightOverflowAuto = add """
        <div style='width: 0; height: 0px; overflow: auto;'>
          <span>parent no size, overflow: auto</span>
        </div>"""

      @$parentWithWidthHeightNoOverflow = add """
        <div style='width: 100px; height: 100px; overflow: hidden;'>
          <div style='height: 100px; width: 100px;'>
            <span>parent with size, overflow: hidden</span>
          </div>
        </div>"""

      @$childPosAbs = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px;'>
            <span style='position: absolute;'>position: absolute</span>
          </div>
        </div>"""

      @$childPosFixed = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px;'>
            <span style='position: fixed;'>position: fixed</span>
          </div>
        </div>"""

      @$descendentPosAbs = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px; position: absolute;'>
            <span>no width, descendant position: absolute</span>
          </div>
        </div>"""

      @$descendentPosFixed = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px; position: fixed;'>
            <span>no width, descendant position: fixed</span>
          </div>
        </div>"""

      @$parentPosAbs = add """
        <div style='width: 0; height: 100px; overflow: hidden; position: absolute;'>
          <div style='height: 500px; width: 500px;'>
            <span>parent position: absolute</span>
          </div>
        </div>"""

      @$parentDisplayNone = add """
        <div id="none" style='display: none;'>
          <span>parent display: none</span>
        </div>
        """

      @$elOutOfParentBoundsToLeft = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: -400px; top: 0px;'>position: absolute, out of bounds left</span>
        </div>
      """

      @$elOutOfParentBoundsToRight = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 200px; top: 0px;'>position: absolute, out of bounds right</span>
        </div>
      """

      @$elOutOfParentBoundsAbove = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 0px; top: -100px;'>position: absolute, out of bounds above</span>
        </div>
      """

      @$elOutOfParentBoundsBelow = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 0px; top: 200px;'>position: absolute, out of bounds below</span>
        </div>
      """

      @$elOutOfParentWithOverflowYHiddenBounds = add """
        <div style='width: 100px; height: 100px; overflow-y: hidden; position: relative;'>
          <span style='position: absolute; left: 0px; top: 200px;'>position: absolute, out of bounds below</span>
        </div>
      """

      @$elOutOfParentWithOverflowXHiddenBounds = add """
        <div style='width: 100px; height: 100px; overflow-x: hidden; position: relative;'>
          <span style='position: absolute; left: 200px; top: 0;'>position: absolute, out of bounds below</span>
        </div>
      """

      @$elInPosAbsParentsBounds = add """
        <div style='width: 200px; height: 200px; overflow: hidden; position: relative;'>
          <div style='position: absolute;'>
            <div style='position: absolute;'>
              <span style='position: absolute; left: 50px; top: 50px;'>in bounds, parent position: absolute</span>
            </div>
          </div>
        </div>
      """

      @$elOutOfPosAbsParentsBounds = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative; top: 700px; left: 700px;'>
          <div style='position: absolute;'>
            <div style='position: absolute;'>
              <span style='position: absolute; left: -300px; top: 0px;'>out of bounds, parent position: absolute</span>
            </div>
          </div>
        </div>
      """

      @$elInParentBounds = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 0px; top: 0px;'>in bounds, position: absolute</span>
        </div>
      """

      @$elOutOfScrollingParentBounds = add """
        <div style='width: 100px; height: 100px; overflow: scroll; position: relative; top: 700px; left: 700px;'>
          <div style='position: absolute;'>
            <div style='position: absolute;'>
              <span style='position: absolute; left: 300px; top: 0px;'>out of scrolling bounds, position: absolute</span>
            </div>
          </div>
        </div>
      """

      @$elIsOutOfBoundsOfAncestorsOverflowButWithinRelativeAncestor = add """
        <div style='padding: 100px; position: relative;'>
          <div style='overflow: hidden;'>
            <div>
              <span style='position: absolute; left: 0; top: 0;'>in bounds of ancestor, position: absolute, parent overflow: hidden</span>
            </div>
          </div>
        </div>
      """

      @$elIsRelativeAndOutOfBoundsOfAncestorOverflow = add """
        <div style='overflow: hidden;'>
          <div>
            <span style='position: relative; left: 0; top: -200px;'>out of bounds, position: relative</span>
          </div>
        </div>
      """

      @$elIsRelativeAndOutOfBoundsOfAncestorButAncestorShowsOverflow = add """
        <div>
          <div>
            <span style='position: relative; left: 0; top: -200px;'>out of bounds but visible, position: relative</span>
          </div>
        </div>
      """

      @$parentOutOfBoundsButElInBounds = add """
        <div style='position: relative; padding: 20px;'>
          <div style='overflow: hidden;'>
            <div style='position: relative; left: 0; top: -100px;'>
              <span style='position: relative; left: 0; top: 100px;'>in bounds of ancestor, parent out of bounds</span>
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

    it "is hidden when parent overflow-y hidden and out of bounds", ->
      expect(@$elOutOfParentWithOverflowYHiddenBounds.find("span")).to.be.hidden

    it "is hidden when parent overflow-x hidden and out of bounds", ->
      expect(@$elOutOfParentWithOverflowXHiddenBounds.find("span")).to.be.hidden

    it "is hidden when parent overflow scroll and out of bounds", ->
      expect(@$elOutOfScrollingParentBounds.find("span")).to.be.hidden

    it "is hidden when parent absolutely positioned and overflow hidden and out of bounds", ->
      expect(@$elOutOfPosAbsParentsBounds.find("span")).to.be.hidden

    it "is visible when parent absolutely positioned and overflow hidden and not out of bounds", ->
      expect(@$elInPosAbsParentsBounds.find("span")).to.be.visible

    it "is visible when parent overflow hidden and not out of bounds", ->
      expect(@$elInParentBounds.find("span")).to.be.visible

    it "is visible when ancestor is overflow hidden but more distant ancestor is position relative", ->
      expect(@$elIsOutOfBoundsOfAncestorsOverflowButWithinRelativeAncestor.find("span")).to.be.visible

    it "is hidden when relatively positioned outside ancestor with overflow hidden", ->
      expect(@$elIsRelativeAndOutOfBoundsOfAncestorOverflow.find("span")).to.be.hidden

    it "is visible when el is relatively positioned outside ancestor that does not hide overflow", ->
      expect(@$elIsRelativeAndOutOfBoundsOfAncestorButAncestorShowsOverflow.find("span")).to.be.visible

    it "is visible when parent is relatively positioned out of bounds but el is relatively positioned back in bounds", ->
      expect(@$parentOutOfBoundsButElInBounds.find("span")).to.be.visible

    describe "#getReasonElIsHidden", ->
      beforeEach ->
        @reasonIs = ($el, str) ->
          expect($dom.getReasonElIsHidden($el)).to.eq(str)

      it "has 'display: none'", ->
        @reasonIs @$displayNone, "This element '<button>' is not visible because it has CSS property: 'display: none'"

      it "has a parent with 'display: none'", ->
        @reasonIs @$parentDisplayNone.find("span"), "This element '<span>' is not visible because its parent '<div#none>' has CSS property: 'display: none'"

      it "has 'visibility: hidden'", ->
        @reasonIs @$visHidden, "This element '<ul>' is not visible because it has CSS property: 'visibility: hidden'"

      it "has parent with 'visibility: hidden'", ->
        @reasonIs @$parentVisHidden.find("button"), "This element '<button>' is not visible because its parent '<div.invis>' has CSS property: 'visibility: hidden'"

      it "has effective zero width", ->
        @reasonIs @$divNoWidth, "This element '<div>' is not visible because it has an effective width and height of: '0 x 100' pixels."

      it "has effective zero height", ->
        @reasonIs @$divNoHeight, "This element '<div>' is not visible because it has an effective width and height of: '50 x 0' pixels."

      it "has a parent with an effective zero width and overflow: hidden", ->
        @reasonIs @$parentNoHeight.find("span"), "This element '<span>' is not visible because its parent '<div>' has CSS property: 'overflow: hidden' and an effective width and height of: '100 x 0' pixels."

      it "element sits outside boundaries of parent with overflow clipping", ->
        @reasonIs @$elOutOfParentBoundsToRight.find("span"), "This element '<span>' is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: \'hidden\', \'scroll\' or \'auto\'"

      it "cannot determine why element is not visible", ->
        @reasonIs @$btnOpacity, "Cypress could not determine why this element '<button>' is not visible."
