$dom = Cypress.dom
$ = Cypress.$.bind(Cypress)

describe "src/cypress/dom/visibility", ->
  beforeEach ->
    cy.visit("/fixtures/generic.html")

  context "isHidden", ->
    it "exposes isHidden", ->
      expect($dom.isHidden).to.be.a("function")

    it "throws when not passed a DOM element", ->
      fn = ->
        $dom.isHidden(null)

      expect(fn).to.throw("Cypress.dom.isHidden() failed because it requires a DOM element. The subject received was: \'null\'")

  context "isVisible", ->
    it "exposes isVisible", ->
      expect($dom.isVisible).to.be.a("function")

    it "throws when not passed a DOM element", ->
      fn = ->
        $dom.isVisible("form")

      expect(fn).to.throw("Cypress.dom.isVisible() failed because it requires a DOM element. The subject received was: \'form\'")

  context "#isScrollable", ->
    beforeEach ->
      @add = (el) =>
        $(el).appendTo(cy.$$("body"))

    it "returns true if window and body > window height", ->
      @add("<div style='height: 1000px;' />")
      win = cy.state("window")

      fn = => $dom.isScrollable(win)

      expect(fn()).to.be.true

    it "returns false window and body > window height", ->

      cy.$$("body").html("<div>foo</div>")

      win = cy.state("window")

      fn = -> $dom.isScrollable(win)

      expect(fn()).to.be.false

    it "returns false el is not scrollable", ->
      noScroll = @add """
        <div style="height: 100px; overflow: auto;">
          <div>No Scroll</div>
        </div>
        """

      fn = => $dom.isScrollable(noScroll)

      expect(fn()).to.be.false

    it "returns false el has no overflow", ->
      noOverflow = @add """
        <div style="height: 100px; width: 100px; border: 1px solid green;">
          <div style="height: 150px;">
            No Overflow Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Etiam porta sem malesuada magna mollis euismod.
          </div>
        </div>
        """

      fn = => $dom.isScrollable(noOverflow)

      expect(fn()).to.be.false

    it "returns true when vertically scrollable", ->
      vertScrollable = @add """
        <div style="height: 100px; width: 100px; overflow: auto;">
          <div style="height: 150px;">Vertical Scroll</div>
        </div>
      """

      fn = => $dom.isScrollable(vertScrollable)

      expect(fn()).to.be.true

    it "returns true when horizontal scrollable", ->
      horizScrollable = @add """
        <div style="height: 100px; width: 100px; overflow: auto; ">
          <div style="height: 150px;">Horizontal Scroll</div>
        </div>
      """

      fn = => $dom.isScrollable(horizScrollable)

      expect(fn()).to.be.true

    it "returns true when overflow scroll forced and content larger", ->
      forcedScroll = @add """
        <div style="height: 100px; width: 100px; overflow: scroll; border: 1px solid yellow;">
          <div style="height: 300px; width: 300px;">Forced Scroll</div>
        </div>
      """

      fn = => $dom.isScrollable(forcedScroll)

      expect(fn()).to.be.true

  context "hidden/visible overrides", ->
    beforeEach ->
      add = (el) =>
        $(el).appendTo(cy.$$("body"))

      ## ensure all tests run against a scrollable window
      scrollThisIntoView = add "<div style='height: 1000px;' /><div>Should be in view</div>"

      @$visHidden  = add "<ul style='visibility: hidden;'></ul>"
      @$parentVisHidden = add "<div class='invis' style='visibility: hidden;'><button>parent visibility: hidden</button></div>"
      @$displayNone = add "<button style='display: none'>display: none</button>"
      @$inputHidden = add "<input type='hidden' value='abcdef'>"
      @$btnOpacity = add "<button style='opacity: 0;'>opacity: 0</button>"
      @$divNoWidth = add "<div style='width: 0; height: 100px;'>width: 0</div>"
      @$divNoHeight = add "<div style='width: 50px; height: 0px;'>height: 0</div>"

      @$optionInSelect = add """
        <select>
          <option>Naruto</option>
        </select>
      """

      @$optgroupInSelect = add """
        <select>
          <optgroup label='Shinobi'>
            <option>Naruto</option>
          </optgroup>
        </select>
      """

      @$optionInHiddenSelect = add """
        <select style='display: none'>
          <option>Sasuke</option>
        </select>
      """

      @$optionOutsideSelect = add """
        <div style='display: none'>
          <option id='option-hidden'>Sasuke</option>
        </div>
        <div>
          <option id='option-visible'>Naruto</option>
        </div>
      """

      @$optionHiddenInSelect = add """
        <select>
          <option>--Select--</option>
          <option id="hidden-opt" style='display: none'>Sakura</option>
        </select>
      """

      @$tableVisCollapse = add """
        <table>
          <tr>
            <td>Naruto</td>
            <td class='collapse' style='visibility: collapse;'>Sasuke</td>
            <td>Sakura</td>
          </tr>
          <tr class='collapse' style='visibility: collapse;'>
            <td>Kaguya</td>
            <td><span id='collapse-span'>Madara</span></td>
            <td>Orochimaro</td>
          </tr>
        </table>
      """
      
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
        <div id="childPosFixed" style='width: 100px; height: 100px; overflow: hidden;'>
          <button style='position: fixed; top: 0;'>position: fixed</button>
        </div>"""

      @$descendentPosAbs = add """
        <div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px; position: absolute;'>
            <span>no width, descendant position: absolute</span>
          </div>
        </div>"""

      @$descendentPosFixed = add """
        <div id="descendentPosFixed" style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px; position: fixed; top: 0; right: 0;'>
            <button>no width, descendant position: fixed</button>
          </div>
        </div>"""

      @$descendantInPosFixed = add """
        <div>
          <div id="descendantInPosFixed" style="width: 200px; position: fixed; bottom: 0; right: 0">
            underneath
            <div style="width: 200px; position: fixed; bottom: 0; right: 0">on top of the other</div>
          </div>
        </div>
      """

      @$coveredUpPosFixed = add """
        <div>
          <div id="coveredUpPosFixed" style="position: fixed; bottom: 0; left: 0">underneath</div>
          <div style="position: fixed; bottom: 0; left: 0">on top</div>
        </div>
      """

      @$offScreenPosFixed = add """
        <div id="offScreenPosFixed" style="position: fixed; bottom: 0; left: -100px;">off screen</div>
      """

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
        <div id="elOutOfParentBoundsToRight" style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 200px; top: 0px;'>position: absolute, out of bounds right</span>
        </div>
      """

      @$elOutOfParentBoundsAbove = add """
        <div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <span style='position: absolute; left: 0px; top: -100px;'>position: absolute, out of bounds above</span>
        </div>
      """

      @$elOutOfParentBoundsBelow = add """
        <div id="elOutOfParentBoundsBelow" style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
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

      @$elOutOfParentWithFlexAndOverflowHiddenBounds = add """
      <div style="display: flex; overflow: hidden;">
        <div id="red" style="flex: 0 0 80%; background-color: red;">red</div>
        <div id="green" style="flex: 0 0 80%; background-color: green;">green</div>
        <div id="blue" style="background-color: blue;">blue</div>
      </div>
    """

      @$elOutOfParentWithOverflowHiddenBoundsButCloserPositionAbsoluteParent = add """
      <div style="border: 1px solid red; width: 200px; height: 200px; overflow: hidden;">
        <div style="position: absolute; left: 300px; border: 1px solid blue; width: 200px; height: 200px;">
          <span style="border: 1px solid green;">Hello</span>
        </div>
      """

      @$elOutOfAncestorOverflowAutoBounds = add """
        <div style='width: 100px; height: 100px; overflow: auto;'>
          <div style='width: 1000px; position: relative;'>
            <span style='position: absolute; left: 300px; top: 0px;'>out of bounds, parent wide, ancestor overflow: auto</span>
          </div>
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

      @$parentWithClipPathAbsolutePositionElOutsideClipPath = add """
        <div style="position: absolute; clip-path: polygon(0 0, 0 0, 0 0, 0 0);">
          <span>clip-path</span>
        </div>
      """

      @$parentWithClipPathAbsolutePositionElInsideClipPath = add """
        <div style="position: absolute; clip-path: circle(100%);">
          <span>clip-path</span>
        </div>
      """

      @$parentWithTransformScaleElOutsideScale = add """
        <div style="transform: scale(0,0)">
          <span>TRANSFORMERS</span>
        </div>
      """

      @$parentWithTransformScaleElInsideScale = add """
        <div style="transform: scale(1,1)">
          <span>TRANSFORMERS</span>
        </div>
      """

      @$parentsWithBackfaceVisibilityHidden = add """
        <div style="position: absolute; width: 200px; height: 260px; background: red; backface-visibility: hidden;">
          <span id="front">front</span>
        </div>
        <div style="position: absolute; width: 200px; height: 260px; background: blue; backface-visibility: hidden; transform: rotateY(180deg);">
          <span id="back" >back</span>
        </div>
      """

      @$ancestorTransformMakesElOutOfBoundsOfAncestor = add """
        <div style='margin-left: 100px; overflow: hidden; width: 100px;'>
          <div style='transform: translateX(-100px); width: 200px;'>
            <div style='width: 100px;'>
              <span>out of ancestor's bounds due to ancestor translate</span>
            </div>
          </div>
        </div>
      """

      @$ancestorTransformMakesElInBoundsOfAncestor = add """
        <div style='margin-left: 100px; overflow: hidden; width: 100px;'>
          <div style='transform: translateX(-100px); width: 300px;'>
            <div style='display: inline-block; width: 100px;'>
              <span>out of ancestor's bounds due to ancestor translate</span>
            </div>
            <div id='inbounds' style='display: inline-block; width: 100px;'>
              <span>in ancestor's bounds due to ancestor translate</span>
            </div>
          </div>
        </div>
      """

      # scroll the 2nd element into view so that
      # there is always a scrollTop so we ensure
      # its factored in (window vs viewport) calculations
      scrollThisIntoView.get(1).scrollIntoView()

    describe "html or body", ->
      it "is visible if html", ->
        expect(cy.$$("html").is(":hidden")).to.be.false
        expect(cy.$$("html").is(":visible")).to.be.true

        expect(cy.$$("html")).not.to.be.hidden
        expect(cy.$$("html")).to.be.visible

        cy.wrap(cy.$$("html")).should("not.be.hidden")
        cy.wrap(cy.$$("html")).should("be.visible")

      it "is visible if body", ->
        expect(cy.$$("body").is(":hidden")).to.be.false
        expect(cy.$$("body").is(":visible")).to.be.true

        expect(cy.$$("body")).not.to.be.hidden
        expect(cy.$$("body")).to.be.visible

        cy.wrap(cy.$$("body")).should("not.be.hidden")
        cy.wrap(cy.$$("body")).should("be.visible")

      it "is visible if display none on body or html", ->
        cy.$$("html").css("display", "none")
        cy.$$("body").css("display", "none")

        expect(cy.$$("html")).not.to.be.hidden
        expect(cy.$$("html")).to.be.visible

        expect(cy.$$("body")).not.to.be.hidden
        expect(cy.$$("body")).to.be.visible

    describe "css visibility", ->
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

      it "is hidden if visibility collapse", ->
        expect(@$tableVisCollapse.find("td.collapse")).to.be.hidden
        expect(@$tableVisCollapse.find("td.collapse")).to.not.be.visible  

        expect(@$tableVisCollapse.find("tr.collapse")).to.be.hidden
        expect(@$tableVisCollapse.find("tr.collapse")).to.not.be.visible  

        expect(@$tableVisCollapse.find("tr.collapse td")).to.be.hidden
        expect(@$tableVisCollapse.find("tr.collapse td")).to.not.be.visible  

      it "is hidden if parent has visibility collapse", ->
        expect(@$tableVisCollapse.find("tr.collapse td")).to.be.hidden
        expect(@$tableVisCollapse.find("tr.collapse td")).to.not.be.visible  

        expect(@$tableVisCollapse.find("#collapse-span")).to.be.hidden
        expect(@$tableVisCollapse.find("#collapse-span")).to.not.be.visible  

      it "is hidden if input type hidden", ->
        expect(@$inputHidden.is(":hidden")).to.be.true
        expect(@$inputHidden.is(":visible")).to.be.false

        expect(@$inputHidden).to.be.hidden
        expect(@$inputHidden).to.not.be.visible

        cy.wrap(@$inputHidden).should("be.hidden")
        cy.wrap(@$inputHidden).should("not.be.visible")

    describe "option and optgroup", ->
      it "is visible if option in visible select", ->
        expect(@$optionInSelect.find('option').is(":hidden")).to.be.false
        expect(@$optionInSelect.find('option').is(":visible")).to.be.true

        expect(@$optionInSelect.find('option')).not.to.be.hidden
        expect(@$optionInSelect.find('option')).to.be.visible

        cy.wrap(@$optionInSelect.find('option')).should("not.be.hidden")
        cy.wrap(@$optionInSelect.find('option')).should("be.visible")

      it "is visible if optgroup in visible select", ->
        expect(@$optgroupInSelect.find('optgroup').is(":hidden")).to.be.false
        expect(@$optgroupInSelect.find('optgroup').is(":visible")).to.be.true

        expect(@$optgroupInSelect.find('optgroup')).not.to.be.hidden
        expect(@$optgroupInSelect.find('optgroup')).to.be.visible

        cy.wrap(@$optgroupInSelect.find('optgroup')).should("not.be.hidden")
        cy.wrap(@$optgroupInSelect.find('optgroup')).should("be.visible")

      it "is hidden if option in hidden select", ->
        expect(@$optionInHiddenSelect.find('option').is(":hidden")).to.be.true
        expect(@$optionInHiddenSelect.find('option').is(":visible")).to.be.false

        expect(@$optionInHiddenSelect.find('option')).to.be.hidden
        expect(@$optionInHiddenSelect.find('option')).not.to.be.visible

        cy.wrap(@$optionInHiddenSelect.find('option')).should("be.hidden")
        cy.wrap(@$optionInHiddenSelect.find('option')).should("not.be.visible")

      it "is hidden if option is display none", ->
        expect(@$optionHiddenInSelect.find('#hidden-opt').is(":hidden")).to.be.true
        expect(@$optionHiddenInSelect.find('#hidden-opt').is(":visible")).to.be.false

        expect(@$optionHiddenInSelect.find('#hidden-opt')).to.be.hidden
        expect(@$optionHiddenInSelect.find('#hidden-opt')).not.to.be.visible

        cy.wrap(@$optionHiddenInSelect.find('#hidden-opt')).should("be.hidden")
        cy.wrap(@$optionHiddenInSelect.find('#hidden-opt')).should("not.be.visible")

      it "follows regular visibility logic if option outside of select", ->
        expect(@$optionOutsideSelect.find('#option-hidden').is(":hidden")).to.be.true
        expect(@$optionOutsideSelect.find('#option-hidden')).to.be.hidden
        cy.wrap(@$optionOutsideSelect.find('#option-hidden')).should("be.hidden")

        expect(@$optionOutsideSelect.find('#option-visible').is(":visible")).to.be.true
        expect(@$optionOutsideSelect.find('#option-visible')).to.be.visible
        cy.wrap(@$optionOutsideSelect.find('#option-visible')).should("be.visible")
    
    describe "opacity visible", ->
      it "is visible if opacity is 0", ->
        expect(@$btnOpacity.is(":hidden")).to.be.false
        expect(@$btnOpacity.is(":visible")).to.be.true

        expect(@$btnOpacity).not.to.be.hidden
        expect(@$btnOpacity).to.be.visible

        cy.wrap(@$btnOpacity).should("not.be.hidden")
        cy.wrap(@$btnOpacity).should("be.visible")

    describe "width and height", ->
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

    describe "css position", ->
      it "is visible if child has position: absolute", ->
        expect(@$childPosAbs.find("span")).to.be.visible
        expect(@$childPosAbs.find("span")).not.be.hidden

      it "is visible if child has position: fixed", ->
        expect(@$childPosFixed.find("button")).to.be.visible
        expect(@$childPosFixed.find("button")).not.to.be.hidden

      it "is visible if descendent from parent has position: fixed", ->
        expect(@$descendentPosFixed.find("button")).to.be.visible
        expect(@$descendentPosFixed.find("button")).not.to.be.hidden

      it "is visible if has position: fixed and descendent is found", ->
        expect(@$descendantInPosFixed.find("#descendantInPosFixed")).to.be.visible
        expect(@$descendantInPosFixed.find("#descendantInPosFixed")).not.to.be.hidden

      it "is hidden if position: fixed and covered up", ->
        expect(@$coveredUpPosFixed.find("#coveredUpPosFixed")).to.be.hidden
        expect(@$coveredUpPosFixed.find("#coveredUpPosFixed")).not.to.be.visible

      it "is hidden if position: fixed and off screent", ->
        expect(@$offScreenPosFixed).to.be.hidden
        expect(@$offScreenPosFixed).not.to.be.visible

      it "is visible if descendent from parent has position: absolute", ->
        expect(@$descendentPosAbs.find("span")).to.be.visible
        expect(@$descendentPosAbs.find("span")).to.not.be.hidden

      it "is hidden if only the parent has position absolute", ->
        expect(@$parentPosAbs.find("span")).to.be.hidden
        expect(@$parentPosAbs.find("span")).to.not.be.visible

    describe "css overflow", ->
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

      it "is visible when parent overflow hidden but el in a closer parent with position absolute", ->
        expect(@$elOutOfParentWithOverflowHiddenBoundsButCloserPositionAbsoluteParent.find("span")).to.be.visible

      it "is hidden when parent flex and overflow hidden and el out of bounds", ->
        expect(@$elOutOfParentWithFlexAndOverflowHiddenBounds.find("#red")).to.be.visible
        expect(@$elOutOfParentWithFlexAndOverflowHiddenBounds.find("#green")).to.be.visible
        expect(@$elOutOfParentWithFlexAndOverflowHiddenBounds.find("#blue")).to.be.hidden

      it "is hidden when parent is wide and ancestor is overflow auto", ->
        expect(@$elOutOfAncestorOverflowAutoBounds.find("span")).to.be.hidden

      it "is hidden when parent overflow scroll and out of bounds", ->
        expect(@$elOutOfScrollingParentBounds.find("span")).to.be.hidden

      it "is hidden when parent absolutely positioned and overflow hidden and out of bounds", ->
        expect(@$elOutOfPosAbsParentsBounds.find("span")).to.be.hidden

      it "is visible when parent absolutely positioned and overflow hidden and not out of bounds", ->
        expect(@$elInPosAbsParentsBounds.find("span")).to.be.visible

      it "is visible when parent overflow hidden and not out of bounds", ->
        expect(@$elInParentBounds.find("span")).to.be.visible

      it "is visible when ancestor is overflow hidden but more distant ancestor is the offset parent", ->
        expect(@$elIsOutOfBoundsOfAncestorsOverflowButWithinRelativeAncestor.find("span")).to.be.visible

      it "is hidden when relatively positioned outside ancestor with overflow hidden", ->
        expect(@$elIsRelativeAndOutOfBoundsOfAncestorOverflow.find("span")).to.be.hidden

      it "is visible when el is relatively positioned outside ancestor that does not hide overflow", ->
        expect(@$elIsRelativeAndOutOfBoundsOfAncestorButAncestorShowsOverflow.find("span")).to.be.visible

      it "is visible when parent is relatively positioned out of bounds but el is relatively positioned back in bounds", ->
        expect(@$parentOutOfBoundsButElInBounds.find("span")).to.be.visible

    describe "css clip-path", ->
      it.skip "is hidden when outside of parents clip-path", ->
        expect(@$parentWithClipPathAbsolutePositionElOutsideClipPath.find("span")).to.be.hidden

      it "is visible when inside of parents clip-path", ->
        expect(@$parentWithClipPathAbsolutePositionElInsideClipPath.find("span")).to.be.visible

    describe "css transform", ->
      it.skip "is hidden when outside parents transform scale", ->
        expect(@$parentWithTransformScaleElOutsideScale.find("span")).to.be.hidden

      it "is visible when inside of parents transform scale", ->
        expect(@$parentWithTransformScaleElInsideScale.find("span")).to.be.visible
      
      it "is hidden when out of ancestor's bounds due to ancestor's transform", ->
        expect(@$ancestorTransformMakesElOutOfBoundsOfAncestor.find("span")).to.be.hidden

      it "is visible when in ancestor's bounds due to ancestor's transform", ->
        expect(@$ancestorTransformMakesElInBoundsOfAncestor.find("#inbounds")).to.be.visible

    describe "css backface-visibility", ->
      it "is visible when backface not visible", ->
        expect(@$parentsWithBackfaceVisibilityHidden.find("#front")).to.be.visible

      it.skip "is hidden when backface visible", ->
        expect(@$parentsWithBackfaceVisibilityHidden.find("#back")).to.be.hidden

    describe "#getReasonIsHidden", ->
      beforeEach ->
        @reasonIs = ($el, str) ->
          expect($dom.getReasonIsHidden($el)).to.eq(str)

      it "has 'display: none'", ->
        @reasonIs @$displayNone, "This element '<button>' is not visible because it has CSS property: 'display: none'"

      it "has a parent with 'display: none'", ->
        @reasonIs @$parentDisplayNone.find("span"), "This element '<span>' is not visible because its parent '<div#none>' has CSS property: 'display: none'"

      it "has 'visibility: hidden'", ->
        @reasonIs @$visHidden, "This element '<ul>' is not visible because it has CSS property: 'visibility: hidden'"

      it "has parent with 'visibility: hidden'", ->
        @reasonIs @$parentVisHidden.find("button"), "This element '<button>' is not visible because its parent '<div.invis>' has CSS property: 'visibility: hidden'"

      it "has 'visibility: collapse'", ->
        @reasonIs @$tableVisCollapse.find("td.collapse"), "This element '<td.collapse>' is not visible because it has CSS property: 'visibility: collapse'"

      it "has parent with 'visibility: collapse'", ->
        @reasonIs @$tableVisCollapse.find("tr.collapse td:first"), "This element '<td>' is not visible because its parent '<tr.collapse>' has CSS property: 'visibility: collapse'"

      it "has effective zero width", ->
        @reasonIs @$divNoWidth, "This element '<div>' is not visible because it has an effective width and height of: '0 x 100' pixels."

      it "has effective zero height", ->
        @reasonIs @$divNoHeight, "This element '<div>' is not visible because it has an effective width and height of: '50 x 0' pixels."

      it "has a parent with an effective zero width and overflow: hidden", ->
        @reasonIs @$parentNoHeight.find("span"), "This element '<span>' is not visible because its parent '<div>' has CSS property: 'overflow: hidden' and an effective width and height of: '100 x 0' pixels."

      it "element sits outside boundaries of parent with overflow clipping", ->
        @reasonIs @$elOutOfParentBoundsToRight.find("span"), "This element '<span>' is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: \'hidden\', \'scroll\' or \'auto\'"

      it "element is fixed and being covered", ->
        @reasonIs @$coveredUpPosFixed.find("#coveredUpPosFixed"), """
        This element '<div#coveredUpPosFixed>' is not visible because it has CSS property: 'position: fixed' and its being covered by another element:

        <div style="position: fixed; bottom: 0; left: 0">on top</div>
        """

      it "cannot determine why element is not visible", ->
        @reasonIs @$btnOpacity, "Cypress could not determine why this element '<button>' is not visible."
