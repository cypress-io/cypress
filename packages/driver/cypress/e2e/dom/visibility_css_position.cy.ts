// @ts-ignore
const { $ } = Cypress

describe('src/cypress/dom/visibility_css_position', () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  context('hidden/visible overrides', () => {
    beforeEach(function () {
      const add = (el) => {
        return $(el).appendTo(cy.$$('body'))
      }

      // ensure all tests run against a scrollable window
      const scrollThisIntoView = add('<div style=`height: 1000px;` /><div>Should be in view</div>')

      this.$optionInSelect = add(`\
<select>
  <option id='optionInSelect' >Naruto</option>
</select>\
`)

      this.$parentOpacityZero = add(`\
<div style="opacity: 0;">
  <button>parent opacity: 0</button>
</div>\
`)

      this.$parentNoWidthOnly = add(`\
<div style='width: 0; height: 100px; overflow: hidden;'>
  <div style='height: 500px; width: 500px;'>
    <span id='parentNoWidthOnly'>parent width: 0</span>
  </div>
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

      this.$childPointerEventsNone = add(`\
<div style="position: fixed; top: 60px;">
  <span style="pointer-events: none;">child pointer-events: none</span>
</div>\
`)

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
    <span id='parentPosAbs'>parent position: absolute</span>
  </div>
</div>`)

      this.$parentPointerEventsNone = add(`\
<div style="pointer-events: none">
  <span id="parentPointerEventsNone" style="position: fixed; left: 0; top: 50%;">parent pointer-events: none</span>
</div>\
`)

      this.$parentPointerEventsNoneCovered = add(`\
<div style="pointer-events: none;">
  <span id="parentPointerEventsNoneCovered" style="position: fixed; top: 40px;">parent pointer-events: none</span>
</div>
<span style="position: fixed; top: 40px; background: red;">covering the element with pointer-events: none</span>\
`)

      // scroll the 2nd element into view so that
      // there is always a scrollTop so we ensure
      // its factored in (window vs viewport) calculations
      scrollThisIntoView.get(1).scrollIntoView()
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
        expect(this.$coveredUpPosFixed.find('#coveredUpPosFixed')).to.not.be.visible
      })

      it('is hidden if position: fixed and off screen', function () {
        expect(this.$offScreenPosFixed).to.be.hidden
        expect(this.$offScreenPosFixed).not.to.be.visible
      })

      it('is visible if descendent from parent has position: absolute', function () {
        expect(this.$descendentPosAbs.find('span')).to.be.visible
        expect(this.$descendentPosAbs.find('span')).to.not.be.hidden
      })

      it('is hidden if only the parent has position absolute', function () {
        expect(this.$parentPosAbs.find('span#parentPosAbs')).to.be.hidden
        expect(this.$parentPosAbs.find('span#parentPosAbs')).to.not.be.visible
      })

      it('is visible if position: fixed and parent has pointer-events: none', function () {
        expect(this.$parentPointerEventsNone.find('span#parentPointerEventsNone')).to.be.visible
      })

      it('is not hidden if position: fixed and parent has pointer-events: none', function () {
        expect(this.$parentPointerEventsNone.find('span#parentPointerEventsNone')).to.not.be.hidden
      })

      it('is not visible if covered when position: fixed and parent has pointer-events: none', function () {
        expect(this.$parentPointerEventsNoneCovered.find('span#parentPointerEventsNoneCovered')).to.be.hidden
        expect(this.$parentPointerEventsNoneCovered.find('span#parentPointerEventsNoneCovered')).to.not.be.visible
      })

      it('is visible if pointer-events: none and parent has position: fixed', function () {
        expect(this.$childPointerEventsNone.find('span')).to.be.visible
        expect(this.$childPointerEventsNone.find('span')).to.not.be.hidden
      })

      it('is visible when position: sticky', () => {
        cy.visit('fixtures/sticky.html')
        cy.get('#button').should('be.visible')
      })
    })
  })
})
