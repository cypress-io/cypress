const $dom = Cypress.dom
const $ = Cypress.$.bind(Cypress)

describe('src/cypress/dom/visibility', () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  context('isHidden', () => {
    it('exposes isHidden', () => {
      expect($dom.isHidden).to.be.a('function')
    })

    it('throws when not passed a DOM element', () => {
      const fn = () => {
        $dom.isHidden(null)
      }

      expect(fn).to.throw('Cypress.dom.isHidden() failed because it requires a DOM element. The subject received was: \'null\'')
    })
  })

  context('isVisible', () => {
    it('exposes isVisible', () => {
      expect($dom.isVisible).to.be.a('function')
    })

    it('throws when not passed a DOM element', () => {
      const fn = () => {
        $dom.isVisible('form')
      }

      expect(fn).to.throw('Cypress.dom.isVisible() failed because it requires a DOM element. The subject received was: \'form\'')
    })
  })

  context('#isScrollable', () => {
    beforeEach(function () {
      this.add = (el) => {
        return $(el).appendTo(cy.$$('body'))
      }
    })

    it('returns true if window and body > window height', function () {
      this.add('<div style=\'height: 1000px;\' />')
      const win = cy.state('window')

      const fn = () => {
        return $dom.isScrollable(win)
      }

      expect(fn()).to.be.true
    })

    it('returns false window and body > window height', () => {
      cy.$$('body').html('<div>foo</div>')

      const win = cy.state('window')

      const fn = () => {
        return $dom.isScrollable(win)
      }

      expect(fn()).to.be.false
    })

    it('returns false el is not scrollable', function () {
      const noScroll = this.add(`\
<div style="height: 100px; overflow: auto;">
  <div>No Scroll</div>
</div>\
`)

      const fn = () => {
        return $dom.isScrollable(noScroll)
      }

      expect(fn()).to.be.false
    })

    it('returns false el has no overflow', function () {
      const noOverflow = this.add(`\
<div style="height: 100px; width: 100px; border: 1px solid green;">
  <div style="height: 150px;">
    No Overflow Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Etiam porta sem malesuada magna mollis euismod.
  </div>
</div>\
`)

      const fn = () => {
        return $dom.isScrollable(noOverflow)
      }

      expect(fn()).to.be.false
    })

    it('returns true when vertically scrollable', function () {
      const vertScrollable = this.add(`\
<div style="height: 100px; width: 100px; overflow: auto;">
  <div style="height: 150px;">Vertical Scroll</div>
</div>\
`)

      const fn = () => {
        return $dom.isScrollable(vertScrollable)
      }

      expect(fn()).to.be.true
    })

    it('returns true when horizontal scrollable', function () {
      const horizScrollable = this.add(`\
<div style="height: 100px; width: 100px; overflow: auto; ">
  <div style="height: 150px;">Horizontal Scroll</div>
</div>\
`)

      const fn = () => {
        return $dom.isScrollable(horizScrollable)
      }

      expect(fn()).to.be.true
    })

    it('returns true when overflow scroll forced and content larger', function () {
      const forcedScroll = this.add(`\
<div style="height: 100px; width: 100px; overflow: scroll; border: 1px solid yellow;">
  <div style="height: 300px; width: 300px;">Forced Scroll</div>
</div>\
`)

      const fn = () => {
        return $dom.isScrollable(forcedScroll)
      }

      expect(fn()).to.be.true
    })
  })

  context('hidden/visible overrides', () => {
    beforeEach(function () {
      const add = (el) => {
        return $(el).appendTo(cy.$$('body'))
      }

      // ensure all tests run against a scrollable window
      const scrollThisIntoView = add('<div style=\'height: 1000px;\' /><div>Should be in view</div>')

      this.$visHidden = add('<ul style=\'visibility: hidden;\'></ul>')
      this.$parentVisHidden = add('<div class=\'invis\' style=\'visibility: hidden;\'><button>parent visibility: hidden</button></div>')
      this.$displayNone = add('<button style=\'display: none\'>display: none</button>')
      this.$inputHidden = add('<input type=\'hidden\' value=\'abcdef\'>')
      this.$btnOpacity = add('<button style=\'opacity: 0;\'>opacity: 0</button>')
      this.$divNoWidth = add('<div style=\'width: 0; height: 100px;\'>width: 0</div>')
      this.$divNoHeight = add('<div style=\'width: 50px; height: 0px;\'>height: 0</div>')
      this.$divDetached = $('<div>foo</div>')

      this.$optionInSelect = add(`\
<select>
  <option>Naruto</option>
</select>\
`)

      this.$optgroupInSelect = add(`\
<select>
  <optgroup label='Shinobi'>
    <option>Naruto</option>
  </optgroup>
</select>\
`)

      this.$optionInHiddenSelect = add(`\
<select style='display: none'>
  <option>Sasuke</option>
</select>\
`)

      this.$optionOutsideSelect = add(`\
<div style='display: none'>
  <option id='option-hidden'>Sasuke</option>
</div>
<div>
  <option id='option-visible'>Naruto</option>
</div>\
`)

      this.$optionHiddenInSelect = add(`\
<select>
  <option>--Select--</option>
  <option id="hidden-opt" style='display: none'>Sakura</option>
</select>\
`)

      this.$tableVisCollapse = add(`\
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
</table>\
`)

      this.$parentNoWidth = add(`\
<div style='width: 0; height: 100px; overflow: hidden;'>
  <div style='height: 500px; width: 500px;'>
    <span>parent width: 0</span>
  </div>
</div>`)

      this.$parentNoHeight = add(`\
<div style='width: 100px; height: 0px; overflow: hidden;'>
  <span>parent height: 0</span>
</div>`)

      this.$parentNoWidthHeightOverflowAuto = add(`\
<div style='width: 0; height: 0px; overflow: auto;'>
  <span>parent no size, overflow: auto</span>
</div>`)

      this.$parentWithWidthHeightNoOverflow = add(`\
<div style='width: 100px; height: 100px; overflow: hidden;'>
  <div style='height: 100px; width: 100px;'>
    <span>parent with size, overflow: hidden</span>
  </div>
</div>`)

      this.$childPosAbs = add(`\
<div style='width: 0; height: 100px; overflow: hidden;'>
  <div style='height: 500px; width: 500px;'>
    <span style='position: absolute;'>position: absolute</span>
  </div>
</div>`)

      this.$childPosFixed = add(`\
<div id="childPosFixed" style='width: 100px; height: 100px; overflow: hidden;'>
  <button style='position: fixed; top: 0;'>position: fixed</button>
</div>`)

      this.$descendentPosAbs = add(`\
<div style='width: 0; height: 100px; overflow: hidden;'>
  <div style='height: 500px; width: 500px; position: absolute;'>
    <span>no width, descendant position: absolute</span>
  </div>
</div>`)

      this.$descendentPosFixed = add(`\
<div id="descendentPosFixed" style='width: 0; height: 100px; overflow: hidden;'>
  <div style='height: 500px; width: 500px; position: fixed; top: 0; right: 0;'>
    <button>no width, descendant position: fixed</button>
  </div>
</div>`)

      this.$descendantInPosFixed = add(`\
<div>
  <div id="descendantInPosFixed" style="width: 200px; position: fixed; bottom: 0; right: 0">
    underneath
    <div style="width: 200px; position: fixed; bottom: 0; right: 0">on top of the other</div>
  </div>
</div>\
`)

      this.$coveredUpPosFixed = add(`\
<div>
  <div id="coveredUpPosFixed" style="position: fixed; bottom: 0; left: 0">underneath</div>
  <div style="position: fixed; bottom: 0; left: 0">on top</div>
</div>\
`)

      this.$offScreenPosFixed = add(`\
<div id="offScreenPosFixed" style="position: fixed; bottom: 0; left: -100px;">off screen</div>\
`)

      this.$parentPosAbs = add(`\
<div style='width: 0; height: 100px; overflow: hidden; position: absolute;'>
  <div style='height: 500px; width: 500px;'>
    <span>parent position: absolute</span>
  </div>
</div>`)

      this.$parentDisplayNone = add(`\
<div id="none" style='display: none;'>
  <span>parent display: none</span>
</div>\
`)

      this.$elOutOfParentBoundsToLeft = add(`\
<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
  <span style='position: absolute; left: -400px; top: 0px;'>position: absolute, out of bounds left</span>
</div>\
`)

      this.$elOutOfParentBoundsToRight = add(`\
<div id="elOutOfParentBoundsToRight" style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
  <span style='position: absolute; left: 200px; top: 0px;'>position: absolute, out of bounds right</span>
</div>\
`)

      this.$elOutOfParentBoundsAbove = add(`\
<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
  <span style='position: absolute; left: 0px; top: -100px;'>position: absolute, out of bounds above</span>
</div>\
`)

      this.$elOutOfParentBoundsBelow = add(`\
<div id="elOutOfParentBoundsBelow" style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
  <span style='position: absolute; left: 0px; top: 200px;'>position: absolute, out of bounds below</span>
</div>\
`)

      this.$elOutOfParentWithOverflowYHiddenBounds = add(`\
<div style='width: 100px; height: 100px; overflow-y: hidden; position: relative;'>
  <span style='position: absolute; left: 0px; top: 200px;'>position: absolute, out of bounds below</span>
</div>\
`)

      this.$elOutOfParentWithOverflowXHiddenBounds = add(`\
<div style='width: 100px; height: 100px; overflow-x: hidden; position: relative;'>
  <span style='position: absolute; left: 200px; top: 0;'>position: absolute, out of bounds below</span>
</div>\
`)

      this.$elOutOfParentWithFlexAndOverflowHiddenBounds = add(`\
<div style="display: flex; overflow: hidden;">
  <div id="red" style="flex: 0 0 80%; background-color: red;">red</div>
  <div id="green" style="flex: 0 0 80%; background-color: green;">green</div>
  <div id="blue" style="background-color: blue;">blue</div>
</div>\
`)

      this.$elOutOfParentWithOverflowHiddenBoundsButCloserPositionAbsoluteParent = add(`\
<div style="border: 1px solid red; width: 200px; height: 200px; overflow: hidden;">
  <div style="position: absolute; left: 300px; border: 1px solid blue; width: 200px; height: 200px;">
    <span style="border: 1px solid green;">Hello</span>
  </div>\
`)

      this.$elOutOfAncestorOverflowAutoBounds = add(`\
<div style='width: 100px; height: 100px; overflow: auto;'>
  <div style='width: 1000px; position: relative;'>
    <span style='position: absolute; left: 300px; top: 0px;'>out of bounds, parent wide, ancestor overflow: auto</span>
  </div>
</div>\
`)

      this.$elInPosAbsParentsBounds = add(`\
<div style='width: 200px; height: 200px; overflow: hidden; position: relative;'>
  <div style='position: absolute;'>
    <div style='position: absolute;'>
      <span style='position: absolute; left: 50px; top: 50px;'>in bounds, parent position: absolute</span>
    </div>
  </div>
</div>\
`)

      this.$elOutOfPosAbsParentsBounds = add(`\
<div style='width: 100px; height: 100px; overflow: hidden; position: relative; top: 700px; left: 700px;'>
  <div style='position: absolute;'>
    <div style='position: absolute;'>
      <span style='position: absolute; left: -300px; top: 0px;'>out of bounds, parent position: absolute</span>
    </div>
  </div>
</div>\
`)

      this.$elInParentBounds = add(`\
<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
  <span style='position: absolute; left: 0px; top: 0px;'>in bounds, position: absolute</span>
</div>\
`)

      this.$elOutOfScrollingParentBounds = add(`\
<div style='width: 100px; height: 100px; overflow: scroll; position: relative; top: 700px; left: 700px;'>
  <div style='position: absolute;'>
    <div style='position: absolute;'>
      <span style='position: absolute; left: 300px; top: 0px;'>out of scrolling bounds, position: absolute</span>
    </div>
  </div>
</div>\
`)

      this.$elIsOutOfBoundsOfAncestorsOverflowButWithinRelativeAncestor = add(`\
<div style='padding: 100px; position: relative;'>
  <div style='overflow: hidden;'>
    <div>
      <span style='position: absolute; left: 0; top: 0;'>in bounds of ancestor, position: absolute, parent overflow: hidden</span>
    </div>
  </div>
</div>\
`)

      this.$elIsRelativeAndOutOfBoundsOfAncestorOverflow = add(`\
<div style='overflow: hidden;'>
  <div>
    <span style='position: relative; left: 0; top: -200px;'>out of bounds, position: relative</span>
  </div>
</div>\
`)

      this.$elIsRelativeAndOutOfBoundsOfAncestorButAncestorShowsOverflow = add(`\
<div>
  <div>
    <span style='position: relative; left: 0; top: -200px;'>out of bounds but visible, position: relative</span>
  </div>
</div>\
`)

      this.$parentOutOfBoundsButElInBounds = add(`\
<div style='position: relative; padding: 20px;'>
  <div style='overflow: hidden;'>
    <div style='position: relative; left: 0; top: -100px;'>
      <span style='position: relative; left: 0; top: 100px;'>in bounds of ancestor, parent out of bounds</span>
    </div>
  </div>
</div>\
`)

      this.$parentWithClipPathAbsolutePositionElOutsideClipPath = add(`\
<div style="position: absolute; clip-path: polygon(0 0, 0 0, 0 0, 0 0);">
  <span>clip-path</span>
</div>\
`)

      this.$parentWithClipPathAbsolutePositionElInsideClipPath = add(`\
<div style="position: absolute; clip-path: circle(100%);">
  <span>clip-path</span>
</div>\
`)

      this.$parentWithTransformScaleElOutsideScale = add(`\
<div style="transform: scale(0,0)">
  <span>TRANSFORMERS</span>
</div>\
`)

      this.$parentWithTransformScaleElInsideScale = add(`\
<div style="transform: scale(1,1)">
  <span>TRANSFORMERS</span>
</div>\
`)

      this.$parentsWithBackfaceVisibilityHidden = add(`\
<div style="position: absolute; width: 200px; height: 260px; background: red; backface-visibility: hidden;">
  <span id="front">front</span>
</div>
<div style="position: absolute; width: 200px; height: 260px; background: blue; backface-visibility: hidden; transform: rotateY(180deg);">
  <span id="back" >back</span>
</div>\
`)

      this.$ancestorTransformMakesElOutOfBoundsOfAncestor = add(`\
<div style='margin-left: 100px; overflow: hidden; width: 100px;'>
  <div style='transform: translateX(-100px); width: 200px;'>
    <div style='width: 100px;'>
      <span>out of ancestor's bounds due to ancestor translate</span>
    </div>
  </div>
</div>\
`)

      this.$ancestorTransformMakesElInBoundsOfAncestor = add(`\
<div style='margin-left: 100px; overflow: hidden; width: 100px;'>
  <div style='transform: translateX(-100px); width: 300px;'>
    <div style='display: inline-block; width: 100px;'>
      <span>out of ancestor's bounds due to ancestor translate</span>
    </div>
    <div id='inbounds' style='display: inline-block; width: 100px;'>
      <span>in ancestor's bounds due to ancestor translate</span>
    </div>
  </div>
</div>\
`)

      // scroll the 2nd element into view so that
      // there is always a scrollTop so we ensure
      // its factored in (window vs viewport) calculations
      scrollThisIntoView.get(1).scrollIntoView()
    })

    describe('html or body', () => {
      it('is visible if html', () => {
        expect(cy.$$('html').is(':hidden')).to.be.false
        expect(cy.$$('html').is(':visible')).to.be.true

        expect(cy.$$('html')).not.to.be.hidden
        expect(cy.$$('html')).to.be.visible

        cy.wrap(cy.$$('html')).should('not.be.hidden')
        cy.wrap(cy.$$('html')).should('be.visible')
      })

      it('is visible if body', () => {
        expect(cy.$$('body').is(':hidden')).to.be.false
        expect(cy.$$('body').is(':visible')).to.be.true

        expect(cy.$$('body')).not.to.be.hidden
        expect(cy.$$('body')).to.be.visible

        cy.wrap(cy.$$('body')).should('not.be.hidden')
        cy.wrap(cy.$$('body')).should('be.visible')
      })

      it('is visible if display none on body or html', () => {
        cy.$$('html').css('display', 'none')
        cy.$$('body').css('display', 'none')

        expect(cy.$$('html')).not.to.be.hidden
        expect(cy.$$('html')).to.be.visible

        expect(cy.$$('body')).not.to.be.hidden
        expect(cy.$$('body')).to.be.visible
      })
    })

    describe('css visibility', () => {
      it('is hidden if .css(visibility) is hidden', function () {
        expect(this.$visHidden.is(':hidden')).to.be.true
        expect(this.$visHidden.is(':visible')).to.be.false

        expect(this.$visHidden).to.be.hidden
        expect(this.$visHidden).to.not.be.visible

        cy.wrap(this.$visHidden).should('be.hidden')
        cy.wrap(this.$visHidden).should('not.be.visible')
      })

      it('is hidden if parents have .css(visibility) hidden', function () {
        expect(this.$parentVisHidden.find('button').is(':hidden')).to.be.true
        expect(this.$parentVisHidden.find('button').is(':visible')).to.be.false

        expect(this.$parentVisHidden.find('button')).to.be.hidden
        expect(this.$parentVisHidden.find('button')).to.not.be.visible

        cy.wrap(this.$parentVisHidden).find('button').should('be.hidden')
        cy.wrap(this.$parentVisHidden).find('button').should('not.be.visible')
      })

      it('is hidden if visibility collapse', function () {
        expect(this.$tableVisCollapse.find('td.collapse')).to.be.hidden
        expect(this.$tableVisCollapse.find('td.collapse')).to.not.be.visible

        expect(this.$tableVisCollapse.find('tr.collapse')).to.be.hidden
        expect(this.$tableVisCollapse.find('tr.collapse')).to.not.be.visible

        expect(this.$tableVisCollapse.find('tr.collapse td')).to.be.hidden
        expect(this.$tableVisCollapse.find('tr.collapse td')).to.not.be.visible
      })

      it('is hidden if parent has visibility collapse', function () {
        expect(this.$tableVisCollapse.find('tr.collapse td')).to.be.hidden
        expect(this.$tableVisCollapse.find('tr.collapse td')).to.not.be.visible

        expect(this.$tableVisCollapse.find('#collapse-span')).to.be.hidden
        expect(this.$tableVisCollapse.find('#collapse-span')).to.not.be.visible
      })

      it('is hidden if input type hidden', function () {
        expect(this.$inputHidden.is(':hidden')).to.be.true
        expect(this.$inputHidden.is(':visible')).to.be.false

        expect(this.$inputHidden).to.be.hidden
        expect(this.$inputHidden).to.not.be.visible

        cy.wrap(this.$inputHidden).should('be.hidden')
        cy.wrap(this.$inputHidden).should('not.be.visible')
      })
    })

    describe('option and optgroup', () => {
      it('is visible if option in visible select', function () {
        expect(this.$optionInSelect.find('option').is(':hidden')).to.be.false
        expect(this.$optionInSelect.find('option').is(':visible')).to.be.true

        expect(this.$optionInSelect.find('option')).not.to.be.hidden
        expect(this.$optionInSelect.find('option')).to.be.visible

        cy.wrap(this.$optionInSelect.find('option')).should('not.be.hidden')
        cy.wrap(this.$optionInSelect.find('option')).should('be.visible')
      })

      it('is visible if optgroup in visible select', function () {
        expect(this.$optgroupInSelect.find('optgroup').is(':hidden')).to.be.false
        expect(this.$optgroupInSelect.find('optgroup').is(':visible')).to.be.true

        expect(this.$optgroupInSelect.find('optgroup')).not.to.be.hidden
        expect(this.$optgroupInSelect.find('optgroup')).to.be.visible

        cy.wrap(this.$optgroupInSelect.find('optgroup')).should('not.be.hidden')
        cy.wrap(this.$optgroupInSelect.find('optgroup')).should('be.visible')
      })

      it('is hidden if option in hidden select', function () {
        expect(this.$optionInHiddenSelect.find('option').is(':hidden')).to.be.true
        expect(this.$optionInHiddenSelect.find('option').is(':visible')).to.be.false

        expect(this.$optionInHiddenSelect.find('option')).to.be.hidden
        expect(this.$optionInHiddenSelect.find('option')).not.to.be.visible

        cy.wrap(this.$optionInHiddenSelect.find('option')).should('be.hidden')
        cy.wrap(this.$optionInHiddenSelect.find('option')).should('not.be.visible')
      })

      it('is hidden if option is display none', function () {
        expect(this.$optionHiddenInSelect.find('#hidden-opt').is(':hidden')).to.be.true
        expect(this.$optionHiddenInSelect.find('#hidden-opt').is(':visible')).to.be.false

        expect(this.$optionHiddenInSelect.find('#hidden-opt')).to.be.hidden
        expect(this.$optionHiddenInSelect.find('#hidden-opt')).not.to.be.visible

        cy.wrap(this.$optionHiddenInSelect.find('#hidden-opt')).should('be.hidden')
        cy.wrap(this.$optionHiddenInSelect.find('#hidden-opt')).should('not.be.visible')
      })

      it('follows regular visibility logic if option outside of select', function () {
        expect(this.$optionOutsideSelect.find('#option-hidden').is(':hidden')).to.be.true
        expect(this.$optionOutsideSelect.find('#option-hidden')).to.be.hidden
        cy.wrap(this.$optionOutsideSelect.find('#option-hidden')).should('be.hidden')

        expect(this.$optionOutsideSelect.find('#option-visible').is(':visible')).to.be.true
        expect(this.$optionOutsideSelect.find('#option-visible')).to.be.visible

        cy.wrap(this.$optionOutsideSelect.find('#option-visible')).should('be.visible')
      })
    })

    describe('opacity visible', () => {
      it('is visible if opacity is 0', function () {
        expect(this.$btnOpacity.is(':hidden')).to.be.false
        expect(this.$btnOpacity.is(':visible')).to.be.true

        expect(this.$btnOpacity).not.to.be.hidden
        expect(this.$btnOpacity).to.be.visible

        cy.wrap(this.$btnOpacity).should('not.be.hidden')
        cy.wrap(this.$btnOpacity).should('be.visible')
      })
    })

    describe('width and height', () => {
      it('is hidden if offsetWidth is 0', function () {
        expect(this.$divNoWidth.is(':hidden')).to.be.true
        expect(this.$divNoWidth.is(':visible')).to.be.false

        expect(this.$divNoWidth).to.be.hidden
        expect(this.$divNoWidth).to.not.be.visible

        cy.wrap(this.$divNoWidth).should('be.hidden')
        cy.wrap(this.$divNoWidth).should('not.be.visible')
      })

      it('is hidden if parent has overflow: hidden and no width', function () {
        expect(this.$parentNoWidth.find('span')).to.be.hidden
        expect(this.$parentNoWidth.find('span')).to.not.be.visible
      })

      it('is hidden if parent has overflow: hidden and no height', function () {
        expect(this.$parentNoHeight.find('span')).to.be.hidden
        expect(this.$parentNoHeight.find('span')).to.not.be.visible
      })

      it('is visible when parent has positive dimensions even with overflow hidden', function () {
        expect(this.$parentWithWidthHeightNoOverflow.find('span')).to.be.visible
        expect(this.$parentWithWidthHeightNoOverflow.find('span')).to.not.be.hidden
      })
    })

    describe('css position', () => {
      it('is visible if child has position: absolute', function () {
        expect(this.$childPosAbs.find('span')).to.be.visible
        expect(this.$childPosAbs.find('span')).not.be.hidden
      })

      it('is visible if child has position: fixed', function () {
        expect(this.$childPosFixed.find('button')).to.be.visible
        expect(this.$childPosFixed.find('button')).not.to.be.hidden
      })

      it('is visible if descendent from parent has position: fixed', function () {
        expect(this.$descendentPosFixed.find('button')).to.be.visible
        expect(this.$descendentPosFixed.find('button')).not.to.be.hidden
      })

      it('is visible if has position: fixed and descendent is found', function () {
        expect(this.$descendantInPosFixed.find('#descendantInPosFixed')).to.be.visible
        expect(this.$descendantInPosFixed.find('#descendantInPosFixed')).not.to.be.hidden
      })

      it('is hidden if position: fixed and covered up', function () {
        expect(this.$coveredUpPosFixed.find('#coveredUpPosFixed')).to.be.hidden
        expect(this.$coveredUpPosFixed.find('#coveredUpPosFixed')).not.to.be.visible
      })

      it('is hidden if position: fixed and off screent', function () {
        expect(this.$offScreenPosFixed).to.be.hidden
        expect(this.$offScreenPosFixed).not.to.be.visible
      })

      it('is visible if descendent from parent has position: absolute', function () {
        expect(this.$descendentPosAbs.find('span')).to.be.visible
        expect(this.$descendentPosAbs.find('span')).to.not.be.hidden
      })

      it('is hidden if only the parent has position absolute', function () {
        expect(this.$parentPosAbs.find('span')).to.be.hidden
        expect(this.$parentPosAbs.find('span')).to.not.be.visible
      })
    })

    describe('css overflow', () => {
      it('is visible when parent doesnt have overflow hidden', function () {
        expect(this.$parentNoWidthHeightOverflowAuto.find('span')).to.be.visible

        expect(this.$parentNoWidthHeightOverflowAuto.find('span')).to.not.be.hidden
      })

      it('is hidden when parent overflow hidden and out of bounds to left', function () {
        expect(this.$elOutOfParentBoundsToLeft.find('span')).to.be.hidden
      })

      it('is hidden when parent overflow hidden and out of bounds to right', function () {
        expect(this.$elOutOfParentBoundsToRight.find('span')).to.be.hidden
      })

      it('is hidden when parent overflow hidden and out of bounds above', function () {
        expect(this.$elOutOfParentBoundsAbove.find('span')).to.be.hidden
      })

      it('is hidden when parent overflow hidden and out of bounds below', function () {
        expect(this.$elOutOfParentBoundsBelow.find('span')).to.be.hidden
      })

      it('is hidden when parent overflow-y hidden and out of bounds', function () {
        expect(this.$elOutOfParentWithOverflowYHiddenBounds.find('span')).to.be.hidden
      })

      it('is hidden when parent overflow-x hidden and out of bounds', function () {
        expect(this.$elOutOfParentWithOverflowXHiddenBounds.find('span')).to.be.hidden
      })

      it('is visible when parent overflow hidden but el in a closer parent with position absolute', function () {
        expect(this.$elOutOfParentWithOverflowHiddenBoundsButCloserPositionAbsoluteParent.find('span')).to.be.visible
      })

      it('is hidden when parent flex and overflow hidden and el out of bounds', function () {
        expect(this.$elOutOfParentWithFlexAndOverflowHiddenBounds.find('#red')).to.be.visible
        expect(this.$elOutOfParentWithFlexAndOverflowHiddenBounds.find('#green')).to.be.visible
        expect(this.$elOutOfParentWithFlexAndOverflowHiddenBounds.find('#blue')).to.be.hidden
      })

      it('is hidden when parent is wide and ancestor is overflow auto', function () {
        expect(this.$elOutOfAncestorOverflowAutoBounds.find('span')).to.be.hidden
      })

      it('is hidden when parent overflow scroll and out of bounds', function () {
        expect(this.$elOutOfScrollingParentBounds.find('span')).to.be.hidden
      })

      it('is hidden when parent absolutely positioned and overflow hidden and out of bounds', function () {
        expect(this.$elOutOfPosAbsParentsBounds.find('span')).to.be.hidden
      })

      it('is visible when parent absolutely positioned and overflow hidden and not out of bounds', function () {
        expect(this.$elInPosAbsParentsBounds.find('span')).to.be.visible
      })

      it('is visible when parent overflow hidden and not out of bounds', function () {
        expect(this.$elInParentBounds.find('span')).to.be.visible
      })

      it('is visible when ancestor is overflow hidden but more distant ancestor is the offset parent', function () {
        expect(this.$elIsOutOfBoundsOfAncestorsOverflowButWithinRelativeAncestor.find('span')).to.be.visible
      })

      it('is hidden when relatively positioned outside ancestor with overflow hidden', function () {
        expect(this.$elIsRelativeAndOutOfBoundsOfAncestorOverflow.find('span')).to.be.hidden
      })

      it('is visible when el is relatively positioned outside ancestor that does not hide overflow', function () {
        expect(this.$elIsRelativeAndOutOfBoundsOfAncestorButAncestorShowsOverflow.find('span')).to.be.visible
      })

      it('is visible when parent is relatively positioned out of bounds but el is relatively positioned back in bounds', function () {
        expect(this.$parentOutOfBoundsButElInBounds.find('span')).to.be.visible
      })
    })

    describe('css clip-path', () => {
      // TODO: why is this skipped?
      it.skip('is hidden when outside of parents clip-path', function () {
        expect(this.$parentWithClipPathAbsolutePositionElOutsideClipPath.find('span')).to.be.hidden
      })

      it('is visible when inside of parents clip-path', function () {
        expect(this.$parentWithClipPathAbsolutePositionElInsideClipPath.find('span')).to.be.visible
      })
    })

    describe('css transform', () => {
      // TODO: why is this skipped?
      it.skip('is hidden when outside parents transform scale', function () {
        expect(this.$parentWithTransformScaleElOutsideScale.find('span')).to.be.hidden
      })

      it('is visible when inside of parents transform scale', function () {
        expect(this.$parentWithTransformScaleElInsideScale.find('span')).to.be.visible
      })

      it('is hidden when out of ancestor\'s bounds due to ancestor\'s transform', function () {
        expect(this.$ancestorTransformMakesElOutOfBoundsOfAncestor.find('span')).to.be.hidden
      })

      it('is visible when in ancestor\'s bounds due to ancestor\'s transform', function () {
        expect(this.$ancestorTransformMakesElInBoundsOfAncestor.find('#inbounds')).to.be.visible
      })
    })

    describe('css backface-visibility', () => {
      describe('element visibility by backface-visibility and rotation', () => {
        const add = (el) => {
          return $(el).appendTo(cy.$$('body'))
        }

        it('is visible when there is no transform', () => {
          const el = add('<div>No transform</div>')

          expect(el).to.be.visible
        })

        it('is visible when an element is rotated < 90 degrees', () => {
          const el = add('<div style="backface-visibility: hidden; transform: rotateX(45deg)">rotateX(45deg)</div>')

          expect(el).to.be.visible

          const el2 = add('<div style="backface-visibility: hidden; transform: rotateY(-45deg)">rotateY(-45deg)</div>')

          expect(el2).to.be.visible
        })

        it('is invisible when an element is rotated > 90 degrees', () => {
          const el = add('<div style="backface-visibility: hidden; transform: rotateX(135deg)">rotateX(135deg)</div>')

          expect(el).to.be.hidden

          const el2 = add('<div style="backface-visibility: hidden; transform: rotateY(-135deg)">rotateY(-135deg)</div>')

          expect(el2).to.be.hidden
        })

        it('is invisible when an element is rotated in 90 degrees', () => {
          const el = add('<div style="backface-visibility: hidden; transform: rotateX(90deg)">rotateX(90deg)</div>')

          expect(el).to.be.hidden

          const el2 = add('<div style="backface-visibility: hidden; transform: rotateY(-90deg)">rotateY(-90deg)</div>')

          expect(el2).to.be.hidden
        })
      })

      it('is visible when backface not visible', function () {
        expect(this.$parentsWithBackfaceVisibilityHidden.find('#front')).to.be.visible
      })

      it('is hidden when backface visible', function () {
        expect(this.$parentsWithBackfaceVisibilityHidden.find('#back')).to.be.hidden
      })
    })

    describe('#getReasonIsHidden', () => {
      beforeEach(function () {
        this.reasonIs = ($el, str) => {
          expect($dom.getReasonIsHidden($el)).to.eq(str)
        }
      })

      it('has \'display: none\'', function () {
        this.reasonIs(this.$displayNone, 'This element \'<button>\' is not visible because it has CSS property: \'display: none\'')
      })

      it('has a parent with \'display: none\'', function () {
        this.reasonIs(this.$parentDisplayNone.find('span'), 'This element \'<span>\' is not visible because its parent \'<div#none>\' has CSS property: \'display: none\'')
      })

      it('has \'visibility: hidden\'', function () {
        this.reasonIs(this.$visHidden, 'This element \'<ul>\' is not visible because it has CSS property: \'visibility: hidden\'')
      })

      it('has parent with \'visibility: hidden\'', function () {
        this.reasonIs(this.$parentVisHidden.find('button'), 'This element \'<button>\' is not visible because its parent \'<div.invis>\' has CSS property: \'visibility: hidden\'')
      })

      it('has \'visibility: collapse\'', function () {
        this.reasonIs(this.$tableVisCollapse.find('td.collapse'), 'This element \'<td.collapse>\' is not visible because it has CSS property: \'visibility: collapse\'')
      })

      it('has parent with \'visibility: collapse\'', function () {
        this.reasonIs(this.$tableVisCollapse.find('tr.collapse td:first'), 'This element \'<td>\' is not visible because its parent \'<tr.collapse>\' has CSS property: \'visibility: collapse\'')
      })

      it('is detached from the DOM', function () {
        this.reasonIs(this.$divDetached, 'This element \'<div>\' is not visible because it is detached from the DOM')
      })

      it('has effective zero width', function () {
        this.reasonIs(this.$divNoWidth, 'This element \'<div>\' is not visible because it has an effective width and height of: \'0 x 100\' pixels.')
      })

      it('has effective zero height', function () {
        this.reasonIs(this.$divNoHeight, 'This element \'<div>\' is not visible because it has an effective width and height of: \'50 x 0\' pixels.')
      })

      it('has a parent with an effective zero width and overflow: hidden', function () {
        this.reasonIs(this.$parentNoHeight.find('span'), 'This element \'<span>\' is not visible because its parent \'<div>\' has CSS property: \'overflow: hidden\' and an effective width and height of: \'100 x 0\' pixels.')
      })

      it('element sits outside boundaries of parent with overflow clipping', function () {
        this.reasonIs(this.$elOutOfParentBoundsToRight.find('span'), 'This element \'<span>\' is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: \'hidden\', \'scroll\' or \'auto\'')
      })

      it('element is fixed and being covered', function () {
        this.reasonIs(this.$coveredUpPosFixed.find('#coveredUpPosFixed'), `\
This element '<div#coveredUpPosFixed>' is not visible because it has CSS property: 'position: fixed' and its being covered by another element:

<div style="position: fixed; bottom: 0; left: 0">on top</div>\
`)
      })

      it('needs scroll', function () {
        const el = cy.$$('body').append(`
          <div style="position: fixed; top: 0; right: 0; bottom: 0; left: 0; overflow-x: hidden; overflow-y: auto;">
            <div style="height: 800px">Big Element</div>
            <button id="needsScroll">MyButton</button>
          </div>
        `)

        this.reasonIs(el.find('#needsScroll'), `This element \'<button#needsScroll>\' is not visible because its ancestor has 'position: fixed' CSS property and it is overflowed by other elements. How about scrolling to the element with cy.scrollIntoView()?`)
      })

      it('cannot determine why element is not visible', function () {
        this.reasonIs(this.$btnOpacity, 'Cypress could not determine why this element \'<button>\' is not visible.')
      })
    })
  })
})
