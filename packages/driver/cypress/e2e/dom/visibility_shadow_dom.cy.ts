export {} // make typescript see this as a module

const { $ } = Cypress

describe('src/cypress/dom/visibility - shadow dom', () => {
  let add

  beforeEach(() => {
    cy.visit('/fixtures/empty.html').then((win) => {
      win.customElements.define('shadow-root', class extends win.HTMLElement {
        constructor () {
          super()

          // @ts-ignore
          this.attachShadow({ mode: 'open' })
          this.style.display = 'block'
        }
      })

      add = (el, shadowEl, rootIdentifier) => {
        const $el = $(el).appendTo(cy.$$('body'))

        // @ts-ignore
        $(shadowEl).appendTo(cy.$$(rootIdentifier)[0].shadowRoot)

        return $el
      }

      // ensure all tests run against a scrollable window
      const scrollThisIntoView = $(`<div style='height: 1000px; width: 10px;'></div><div>Should be in view</div>`).appendTo(cy.$$('body'))

      // scroll the 2nd element into view so that
      // there is always a scrollTop so we ensure
      // its factored in (window vs viewport) calculations
      scrollThisIntoView.get(1).scrollIntoView()
    })
  })

  describe('css visibility', () => {
    it('is hidden if parent is shadow root and has .css(visibility) hidden', () => {
      const $shadowRootVisHidden = add(
        `<shadow-root id="shadow-root-vis-hidden" style="visibility: hidden;"></shadow-root>`,
        `<button>parent visibility: hidden</button>`,
        '#shadow-root-vis-hidden',
      )

      cy.wrap($shadowRootVisHidden).find('button', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($shadowRootVisHidden).find('button', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden if parent outside of shadow dom has .css(visibility) hidden', () => {
      const $outsideParentVisHidden = add(
        `<div style="visibility: hidden;">
          <shadow-root id="outside-parent-vis-hidden"></shadow-root>
        </div>`,
        `<button>parent visibility: hidden</button>`,
        '#outside-parent-vis-hidden',
      )

      cy.wrap($outsideParentVisHidden).find('button', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($outsideParentVisHidden).find('button', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden if parent outside of shadow dom has visibility collapse', () => {
      const $outsideParentVisCollapse = add(
        `<table>
          <tr>
            <td>Naruto</td>
            <td style='visibility: collapse;'><shadow-root id="outside-parent-vis-collapse"></shadow-root></td>
            <td>Sakura</td>
          </tr>
        </table>`,
        `<span id='collapse-span'>Sasuke</span>`,
        '#outside-parent-vis-collapse',
      )

      cy.wrap($outsideParentVisCollapse).find('#collapse-span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($outsideParentVisCollapse).find('#collapse-span', { includeShadowDom: true }).should('not.be.visible')
    })
  })

  describe('width and height', () => {
    it('is hidden if parent is shadow root and has overflow: hidden and no width', () => {
      const $shadowRootNoWidth = add(
        `<shadow-root id="shadow-root-no-width" style='width: 0; height: 100px; overflow: hidden;'></shadow-root>`,
        `<div style='height: 500px; width: 500px;'>
          <span>parent width: 0</span>
        </div>`,
        '#shadow-root-no-width',
      )

      cy.wrap($shadowRootNoWidth).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($shadowRootNoWidth).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden if parent outside of shadow dom has overflow: hidden and no width', () => {
      const $outsideParentNoWidth = add(
        `<div style='width: 0; height: 100px; overflow: hidden;'>
          <shadow-root id="outside-parent-no-width"></shadow-root>
        </div>`,
        `<div style='height: 500px; width: 500px;'>
          <span>parent width: 0</span>
        </div>`,
        '#outside-parent-no-width',
      )

      cy.wrap($outsideParentNoWidth).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($outsideParentNoWidth).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden if parent is shadow root and has overflow: hidden and no height', () => {
      const $shadowRootNoHeight = add(
        `<shadow-root id="shadow-root-no-height" style='width: 100px; height: 0; overflow: hidden;'></shadow-root>`,
        `<div style='height: 500px; width: 500px;'>
          <span>parent height: 0</span>
        </div>`,
        '#shadow-root-no-height',
      )

      cy.wrap($shadowRootNoHeight).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($shadowRootNoHeight).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden if parent outside of shadow dom has overflow: hidden and no height', () => {
      const $outsideParentNoHeight = add(
        `<div style='width: 100px; height: 0; overflow: hidden;'>
          <shadow-root id="outside-parent-no-height"></shadow-root>
        </div>`,
        `<div style='height: 500px; width: 500px;'>
          <span>parent height: 0</span>
        </div>`,
        '#outside-parent-no-height',
      )

      cy.wrap($outsideParentNoHeight).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($outsideParentNoHeight).find('span', { includeShadowDom: true }).should('not.be.visible')
    })
  })

  describe('css position', () => {
    it('is visible if child has position: absolute', () => {
      const $childPosAbs = add(
        `<div style='width: 0; height: 100px; overflow: hidden;'>
          <shadow-root id="child-pos-absolute"></shadow-root>
        </div>`,
        `<div style='height: 500px; width: 500px;'>
          <span style="position: absolute;">position: absolute</span>
        </div>`,
        '#child-pos-absolute',
      )

      cy.wrap($childPosAbs).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($childPosAbs).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible if child has position: fixed', () => {
      const $childPosFixed = add(
        `<div style='width: 0; height: 100px; overflow: hidden;'>
          <shadow-root id="child-pos-fixed"></shadow-root>
        </div>`,
        `<div style='height: 500px; width: 500px;'>
          <button style="position: fixed; top: 0;">position: fixed</button>
        </div>`,
        '#child-pos-fixed',
      )

      cy.wrap($childPosFixed).find('button', { includeShadowDom: true }).should('be.visible')
      cy.wrap($childPosFixed).find('button', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible if descendent from parent has position: absolute and descendent is outside shadow dom', () => {
      const $descendentPosAbsOutside = add(
        `<div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px; position: absolute;'>
            <shadow-root id="descendent-pos-abs-outside"></shadow-root>
          </div>
        </div>`,
        `<span>no width, descendant position: absolute</span>`,
        '#descendent-pos-abs-outside',
      )

      cy.wrap($descendentPosAbsOutside).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($descendentPosAbsOutside).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible if descendent from parent has position: absolute and descendent is inside shadow dom', () => {
      const $descendentPosAbsInside = add(
        `<div style='width: 0; height: 100px; overflow: hidden;'>
          <shadow-root id="descendent-pos-abs-inside"></shadow-root>
        </div>`,
        `<div style='height: 500px; width: 500px; position: absolute;'>
          <span>no width, descendant position: absolute</span>
        </div>`,
        '#descendent-pos-abs-inside',
      )

      cy.wrap($descendentPosAbsInside).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($descendentPosAbsInside).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible if descendent from parent has position: fixed and descendent is outside shadow dom', () => {
      const $descendentPosFixedOutside = add(
        `<div style='width: 0; height: 100px; overflow: hidden;'>
          <div style='height: 500px; width: 500px; position: fixed; top: 0; right: 0;'>
            <shadow-root id="descendent-pos-fixed-outside"></shadow-root>
          </div>
        </div>`,
        `<button>no width, descendant position: fixed</button>`,
        '#descendent-pos-fixed-outside',
      )

      cy.wrap($descendentPosFixedOutside).find('button', { includeShadowDom: true }).should('be.visible')
      cy.wrap($descendentPosFixedOutside).find('button', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible if descendent from parent has position: fixed and descendent is inside shadow dom', () => {
      const $descendentPosFixedInside = add(
        `<div style='width: 0; height: 100px; overflow: hidden;'>
          <shadow-root id="descendent-pos-fixed-inside"></shadow-root>
        </div>`,
        `<div style='height: 500px; width: 500px; position: fixed; top: 100px; right: 0;'>
          <button>no width, descendant position: fixed</button>
        </div>`,
        '#descendent-pos-fixed-inside',
      )

      cy.wrap($descendentPosFixedInside).find('button', { includeShadowDom: true }).should('be.visible')
      cy.wrap($descendentPosFixedInside).find('button', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is hidden if position: fixed and covered by element outside of shadow dom', () => {
      const $coveredUpByOutsidePosFixed = add(
        `<div>
          <shadow-root id="covered-up-by-outside-pos-fixed"></shadow-root>
          <div style="position: fixed; bottom: 0; left: 0">on top</div>
        </div>`,
        `<div id="inside-underneath" style="position: fixed; bottom: 0; left: 0">underneath</div>`,
        '#covered-up-by-outside-pos-fixed',
      )

      cy.wrap($coveredUpByOutsidePosFixed).find('#inside-underneath', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($coveredUpByOutsidePosFixed).find('#inside-underneath', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden if outside of shadow dom with position: fixed and covered by element inside of shadow dom', () => {
      const $coveredUpByShadowPosFixed = add(
        `<div>
          <div id="outside-underneath" style="position: fixed; bottom: 0; left: 0">underneath</div>
          <shadow-root id="covered-up-by-shadow-pos-fixed"></shadow-root>
        </div>`,
        `<div style="position: fixed; bottom: 0; left: 0">on top</div>`,
        '#covered-up-by-shadow-pos-fixed',
      )

      cy.wrap($coveredUpByShadowPosFixed).find('#outside-underneath', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($coveredUpByShadowPosFixed).find('#outside-underneath', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is visible if position: fixed and parent outside shadow dom has pointer-events: none', () => {
      const $parentPointerEventsNone = add(
        `<div style="pointer-events: none;">
          <shadow-root id="parent-pointer-events-none"></shadow-root>
        </div>`,
        `<span style="position: fixed; top: 20px;">parent pointer-events: none</span>`,
        '#parent-pointer-events-none',
      )

      cy.wrap($parentPointerEventsNone).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($parentPointerEventsNone).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is hidden if covered when position: fixed and parent outside shadow dom has pointer-events: none', () => {
      const $parentPointerEventsNoneCovered = add(
        `<div style="pointer-events: none;">
          <shadow-root id="parent-pointer-events-none-covered"></shadow-root>
        </div>
        <span style="position: fixed; top: 40px; background: red;">covering the element with pointer-events: none</span>`,
        `<span style="position: fixed; top: 40px;">parent pointer-events: none</span>`,
        '#parent-pointer-events-none-covered',
      )

      cy.wrap($parentPointerEventsNoneCovered).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($parentPointerEventsNoneCovered).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is visible if pointer-events: none and parent outside shadow dom has position: fixed', () => {
      const $childPointerEventsNone = add(
        `<div style="position: fixed; top: 60px;">
          <shadow-root id="child-pointer-events-none-covered"></shadow-root>
        </div>`,
        `<span style="pointer-events: none;">child pointer-events: none</span>`,
        '#child-pointer-events-none-covered',
      )

      cy.wrap($childPointerEventsNone).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($childPointerEventsNone).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })
  })

  describe('css overflow', () => {
    it('is hidden when parent outside of shadow dom overflow hidden and out of bounds to left', () => {
      const $elOutOfParentBoundsToLeft = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-bounds-to-left"></shadow-root>
        </div>`,
        `<span style='position: absolute; width: 100px; height: 100px; left: -100px; top: 0;'>position: absolute, out of bounds left</span>`,
        '#el-out-of-parent-bounds-to-left',
      )

      cy.wrap($elOutOfParentBoundsToLeft).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfParentBoundsToLeft).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when parent outside of shadow dom overflow hidden and out of bounds to right', () => {
      const $elOutOfParentBoundsToRight = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-bounds-to-right"></shadow-root>
        </div>`,
        `<span style='position: absolute; width: 100px; height: 100px; right: -100px; top: 0;'>position: absolute, out of bounds right</span>`,
        '#el-out-of-parent-bounds-to-right',
      )

      cy.wrap($elOutOfParentBoundsToRight).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfParentBoundsToRight).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when parent outside of shadow dom overflow hidden and out of bounds above', () => {
      const $elOutOfParentBoundsAbove = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-bounds-above"></shadow-root>
        </div>`,
        `<span style='position: absolute; width: 100px; height: 100px; top: -100px; left: 0;'>position: absolute, out of bounds above</span>`,
        '#el-out-of-parent-bounds-above',
      )

      cy.wrap($elOutOfParentBoundsAbove).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfParentBoundsAbove).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when parent outside of shadow dom overflow hidden and out of bounds below', () => {
      const $elOutOfParentBoundsBelow = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-bounds-below"></shadow-root>
        </div>`,
        `<span style='position: absolute; width: 100px; height: 100px; bottom: -100px; left: 0;'>position: absolute, out of bounds below</span>`,
        '#el-out-of-parent-bounds-below',
      )

      cy.wrap($elOutOfParentBoundsBelow).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfParentBoundsBelow).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when parent outside of shadow dom overflow hidden-y and out of bounds', () => {
      const $elOutOfParentWithOverflowYHiddenBounds = add(
        `<div style='width: 100px; height: 100px; overflow-y: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-with-overflow-y-hidden-bounds"></shadow-root>
        </div>`,
        `<span style='position: absolute; top: 200px; left: 0;'>position: absolute, out of bounds below</span>`,
        '#el-out-of-parent-with-overflow-y-hidden-bounds',
      )

      cy.wrap($elOutOfParentWithOverflowYHiddenBounds).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfParentWithOverflowYHiddenBounds).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when parent outside of shadow dom overflow hidden-x and out of bounds', () => {
      const $elOutOfParentWithOverflowXHiddenBounds = add(
        `<div style='width: 100px; height: 100px; overflow-x: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-with-overflow-x-hidden-bounds"></shadow-root>
        </div>`,
        `<span style='position: absolute; top: 0; left: 200px;'>position: absolute, out of bounds below</span>`,
        '#el-out-of-parent-with-overflow-x-hidden-bounds',
      )

      cy.wrap($elOutOfParentWithOverflowXHiddenBounds).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfParentWithOverflowXHiddenBounds).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is visible when parent overflow hidden but el in a closer parent outside of shadow dom with position absolute', () => {
      const $elOutOfParentWithOverflowHiddenBoundsButCloserPositionAbsoluteParent = add(
        `<div style="border: 1px solid red; width: 200px; height: 200px; overflow: hidden;">
          <div style="position: absolute; left: 300px; border: 1px solid blue; width: 200px; height: 200px;">
            <shadow-root id="el-out-of-parent-with-overflow-hidden-bounds-but-closer-position-absolute-parent"></shadow-root>
          </div>
        </div>`,
        `<span style="border: 1px solid green;">Hello</span>`,
        '#el-out-of-parent-with-overflow-hidden-bounds-but-closer-position-absolute-parent',
      )

      cy.wrap($elOutOfParentWithOverflowHiddenBoundsButCloserPositionAbsoluteParent).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($elOutOfParentWithOverflowHiddenBoundsButCloserPositionAbsoluteParent).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is hidden when parent is wide and ancestor outside shadow dom is overflow auto', () => {
      const $elOutOfAncestorOverflowAutoBoundsOutside = add(
        `<div style='width: 100px; height: 100px; overflow: auto;'>
          <div style='width: 1000px; position: relative;'>
            <shadow-root id="el-out-of-ancestor-overflow-auto-bounds-outside"></shadow-root>
          </div>
        </div>`,
        `<span style='position: absolute; left: 300px; top: 0px;'>out of bounds, parent wide, ancestor overflow: auto</span>`,
        '#el-out-of-ancestor-overflow-auto-bounds-outside',
      )

      cy.wrap($elOutOfAncestorOverflowAutoBoundsOutside).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfAncestorOverflowAutoBoundsOutside).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when parent is wide and ancestor inside shadow dom is overflow auto', () => {
      const $elOutOfAncestorOverflowAutoBoundsInside = add(
        `<div style='width: 100px; height: 100px; overflow: auto;'>
          <shadow-root id="el-out-of-ancestor-overflow-auto-bounds-inside"></shadow-root>
        </div>`,
        `<div style='width: 1000px; position: relative;'>
          <span style='position: absolute; left: 300px; top: 0px;'>out of bounds, parent wide, ancestor overflow: auto</span>
        </div>`,
        '#el-out-of-ancestor-overflow-auto-bounds-inside',
      )

      cy.wrap($elOutOfAncestorOverflowAutoBoundsInside).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfAncestorOverflowAutoBoundsInside).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when parent outside of shadow dom has overflow scroll and out of bounds', () => {
      const $elOutOfScrollingParentBounds = add(
        `<div style='width: 100px; height: 100px; overflow: scroll; position: relative; top: 700px; left: 700px;'>
          <shadow-root id="el-out-of-scrolling-parent-bounds"></shadow-root>
        </div>`,
        `<span style='position: absolute; left: 300px; top: 0;'>out of scrolling bounds, position: absolute</span>`,
        '#el-out-of-scrolling-parent-bounds',
      )

      cy.wrap($elOutOfScrollingParentBounds).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfScrollingParentBounds).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when parent absolutely positioned and overflow hidden and out of bounds', () => {
      const $elOutOfPosAbsParentBounds = add(
        `<div id="ancestor-el" style='width: 100px; height: 100px; overflow: hidden; position: relative; top: 700px; left: 700px;'>
          <div>
            <div id="parent-el" style='position: absolute;'>
              <shadow-root id="el-out-of-pos-abs-parent-bounds"></shadow-root>
            </div>
          </div>
        </div>`,
        `<span id="el-under-test" style='position: absolute; left: -350px; top: 0;'>out of bounds, position: absolute</span>`,
        '#el-out-of-pos-abs-parent-bounds',
      )

      cy.wrap($elOutOfPosAbsParentBounds).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elOutOfPosAbsParentBounds).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is visible when parent absolutely positioned and overflow hidden and not out of bounds', () => {
      const $elInPosAbsParentsBounds = add(
        `<div style='width: 200px; height: 200px; overflow: hidden; position: relative;'>
          <div style='position: absolute;'>
            <shadow-root id="el-in-pos-abs-parent-bounds"></shadow-root>
          </div>
        </div>`,
        `<span style='position: absolute; left: 50px; top: 50px;'>in bounds, parent position: absolute</span>`,
        '#el-in-pos-abs-parent-bounds',
      )

      cy.wrap($elInPosAbsParentsBounds).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($elInPosAbsParentsBounds).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible when parent overflow hidden and not out of bounds', () => {
      const $elInParentBounds = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-in-parent-bounds"></shadow-root>
        </div>`,
        `<span style='position: absolute; left: 0; top: 0;'>in bounds, position: absolute</span>`,
        '#el-in-parent-bounds',
      )

      cy.wrap($elInParentBounds).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($elInParentBounds).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible when ancestor outside shadow dom is overflow hidden but more distant ancestor is the offset parent', () => {
      const $elIsOutOfBoundsOfOutsideAncestorsOverflowButWithinRelativeAncestor = add(
        `<div style='padding: 100px; position: relative;'>
          <div style='overflow: hidden;'>
            <div>
              <shadow-root id="el-is-out-of-bounds-of-outside-ancestors-overflow-but-within-relative-ancestor"></shadow-root>
            </div>
          </div>
        </div>`,
        `<span style='position: absolute; left: 0; top: 0;'>in bounds of ancestor, position: absolute, parent overflow: hidden</span>`,
        '#el-is-out-of-bounds-of-outside-ancestors-overflow-but-within-relative-ancestor',
      )

      cy.wrap($elIsOutOfBoundsOfOutsideAncestorsOverflowButWithinRelativeAncestor).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($elIsOutOfBoundsOfOutsideAncestorsOverflowButWithinRelativeAncestor).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible when ancestor inside shadow dom is overflow hidden but more distant ancestor is the offset parent', () => {
      const $elIsOutOfBoundsOfInsideAncestorsOverflowButWithinRelativeAncestor = add(
        `<div style='padding: 100px; position: relative;'>
          <shadow-root id="el-is-out-of-bounds-of-inside-ancestors-overflow-but-within-relative-ancestor"></shadow-root>
        </div>`,
        `<div style='overflow: hidden;'>
          <div>
            <span style='position: absolute; left: 0; top: 0;'>in bounds of ancestor, position: absolute, parent overflow: hidden</span>
          </div>
        </div>`,
        '#el-is-out-of-bounds-of-inside-ancestors-overflow-but-within-relative-ancestor',
      )

      cy.wrap($elIsOutOfBoundsOfInsideAncestorsOverflowButWithinRelativeAncestor).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($elIsOutOfBoundsOfInsideAncestorsOverflowButWithinRelativeAncestor).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is hidden when relatively positioned outside of ancestor outside shadow dom with overflow hidden', () => {
      const $elIsRelativeAndOutOfBoundsOfAncestorOverflow = add(
        `<div style='overflow: hidden;'>
          <div>
            <shadow-root id="el-is-relative-and-out-of-bounds-of-ancestor-overflow"></shadow-root>
          </div>
        </div>`,
        `<span style='position: relative; left: 0; top: -200px;'>out of bounds, position: relative</span>`,
        '#el-is-relative-and-out-of-bounds-of-ancestor-overflow',
      )

      cy.wrap($elIsRelativeAndOutOfBoundsOfAncestorOverflow).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($elIsRelativeAndOutOfBoundsOfAncestorOverflow).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is visible when relatively positioned outside of ancestor outside shadow dom that does not hide overflow', () => {
      const $elIsRelativeAndOutOfBoundsOfAncestorButAncestorShowsOverflow = add(
        `<div>
          <shadow-root id="el-is-relative-and-out-of-bounds-of-ancestor-but-ancestor-shows-overflow"></shadow-root>
        </div>`,
        `<span style='position: relative; left: 0; top: -200px;'>out of bounds but visible, position: relative</span>`,
        '#el-is-relative-and-out-of-bounds-of-ancestor-but-ancestor-shows-overflow',
      )

      cy.wrap($elIsRelativeAndOutOfBoundsOfAncestorButAncestorShowsOverflow).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($elIsRelativeAndOutOfBoundsOfAncestorButAncestorShowsOverflow).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible when parent inside shadow dom is relatively positioned out of bounds but el is relatively positioned back in bounds', () => {
      const $insideParentOutOfBoundsButElInBounds = add(
        `<div style='position: relative; padding: 20px;'>
          <div style='overflow: hidden;'>
            <shadow-root id="inside-parent-out-of-bounds-but-el-in-bounds"></shadow-root>
          </div>
        </div>`,
        `<div style='position: relative; left: 0; top: -100px;'>
          <span style='position: relative; left: 0; top: 100px;'>in bounds of ancestor, parent out of bounds</span>
        </div>`,
        '#inside-parent-out-of-bounds-but-el-in-bounds',
      )

      cy.wrap($insideParentOutOfBoundsButElInBounds).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($insideParentOutOfBoundsButElInBounds).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is visible when parent outside shadow dom is relatively positioned out of bounds but el is relatively positioned back in bounds', () => {
      const $outsideParentOutOfBoundsButElInBounds = add(
        `<div style='position: relative; padding: 20px;'>
          <div style='overflow: hidden;'>
            <div style='position: relative; left: 0; top: -100px;'>
              <shadow-root id="outside-parent-out-of-bounds-but-el-in-bounds"></shadow-root>
            </div>
          </div>
        </div>`,
        `<span style='position: relative; left: 0; top: 100px;'>in bounds of ancestor, parent out of bounds</span>`,
        '#outside-parent-out-of-bounds-but-el-in-bounds',
      )

      cy.wrap($outsideParentOutOfBoundsButElInBounds).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($outsideParentOutOfBoundsButElInBounds).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })
  })

  describe('css transform', () => {
    it('is hidden when outside parent outside of shadow dom transform scale', () => {
      const $parentWithTransformScaleElOutsideScale = add(
        `<div style="transform: scale(0,0)">
          <shadow-root id="parent-with-transform-scale-el-outside-scale"></shadow-root>
        </div>`,
        `<span>TRANSFORMERS</span>`,
        '#parent-with-transform-scale-el-outside-scale',
      )

      cy.wrap($parentWithTransformScaleElOutsideScale).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($parentWithTransformScaleElOutsideScale).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is visible when inside parent outside of shadow dom transform scale', () => {
      const $parentWithTransformScaleElInsideScale = add(
        `<div style="transform: scale(1,1)">
          <shadow-root id="parent-with-transform-scale-el-inside-scale"></shadow-root>
        </div>`,
        `<span>TRANSFORMERS</span>`,
        '#parent-with-transform-scale-el-inside-scale',
      )

      cy.wrap($parentWithTransformScaleElInsideScale).find('span', { includeShadowDom: true }).should('be.visible')
      cy.wrap($parentWithTransformScaleElInsideScale).find('span', { includeShadowDom: true }).should('not.be.hidden')
    })

    it('is hidden when out of ancestor bounds due to ancestor within shadow dom transform', () => {
      const $ancestorInsideTransformMakesElOutOfBoundsOfAncestor = add(
        `<div style='margin-left: 100px; overflow: hidden; width: 100px;'>
          <shadow-root id="ancestor-inside-transform-makes-el-out-of-bounds-of-ancestor"></shadow-root>
        </div>`,
        `<div style='transform: translateX(-100px); width: 200px;'>
          <div style='width: 100px;'>
            <span>out of ancestor's bounds due to ancestor translate</span>
          </div>
        </div>`,
        '#ancestor-inside-transform-makes-el-out-of-bounds-of-ancestor',
      )

      cy.wrap($ancestorInsideTransformMakesElOutOfBoundsOfAncestor).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($ancestorInsideTransformMakesElOutOfBoundsOfAncestor).find('span', { includeShadowDom: true }).should('not.be.visible')
    })

    it('is hidden when out of ancestor bounds due to ancestor outside shadow dom transform', () => {
      const $ancestorOutsideTransformMakesElOutOfBoundsOfAncestor = add(
        `<div style='margin-left: 100px; overflow: hidden; width: 100px;'>
          <div style='transform: translateX(-100px); width: 200px;'>
            <shadow-root id="ancestor-outside-transform-makes-el-out-of-bounds-of-ancestor"></shadow-root>
          </div>
        </div>`,
        `<div style='width: 100px;'>
            <span>out of ancestor's bounds due to ancestor translate</span>
        </div>`,
        '#ancestor-outside-transform-makes-el-out-of-bounds-of-ancestor',
      )

      cy.wrap($ancestorOutsideTransformMakesElOutOfBoundsOfAncestor).find('span', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($ancestorOutsideTransformMakesElOutOfBoundsOfAncestor).find('span', { includeShadowDom: true }).should('not.be.visible')
    })
  })
})
