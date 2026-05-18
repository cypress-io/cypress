export {} // make typescript see this as a module

const { $ } = Cypress

describe('src/cypress/dom/visibility - shadow dom', () => {
  let add: (el: string, shadowEl: string, rootIdentifier: string) => JQuery<HTMLElement>

  const modes = ['modern', 'legacy']

  for (const mode of modes) {
    describe(`${mode}`, {
      experimentalFastVisibility: mode === 'modern',
    }, () => {
      const isModern = mode === 'modern'

      beforeEach(() => {
        cy.visit('/fixtures/empty.html').then((win) => {
          // Legacy-friendly host: uses inline `style.display = 'block'`, which overrides
          // anything in shadow CSS but loses to inline `style="display: ..."` on the host.
          win.customElements.define('shadow-root', class extends win.HTMLElement {
            constructor () {
              super()

              this.attachShadow({ mode: 'open' })
              this.style.display = 'block'
            }
          })

          // Modern-friendly hosts: apply `display: block` via shadow CSS so that inline
          // `style="display: none"` on the host still wins (inline > :host specificity).
          const installDefaultDisplay = (root: ShadowRoot, doc: Document) => {
            const style = doc.createElement('style')

            style.textContent = ':host { display: block; }'
            root.appendChild(style)
          }

          win.customElements.define('shadow-host', class extends win.HTMLElement {
            constructor () {
              super()
              installDefaultDisplay(this.attachShadow({ mode: 'open' }), this.ownerDocument)
            }
          })

          win.customElements.define('manual-slot-host', class extends win.HTMLElement {
            constructor () {
              super()
              installDefaultDisplay(this.attachShadow({ mode: 'open', slotAssignment: 'manual' }), this.ownerDocument)
            }
          })

          add = (el, shadowEl, rootIdentifier) => {
            const $el = $(el).appendTo(cy.$$('body'))

            $(shadowEl).appendTo(cy.$$(rootIdentifier)[0].shadowRoot!)

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

      describe('display / visibility / opacity on host', () => {
        it('reports descendant as hidden when shadow host has `display: none`', () => {
          const $host = $(`<shadow-host style="display: none;"></shadow-host>`).appendTo(cy.$$('body'))

          $(`<button>inside</button>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('button', { includeShadowDom: true }).should('be.hidden')
          cy.wrap($host).find('button', { includeShadowDom: true }).should('not.be.visible')
        })

        it('reports descendant as hidden when shadow host has `opacity: 0`', () => {
          const $host = $(`<shadow-host style="opacity: 0;"></shadow-host>`).appendTo(cy.$$('body'))

          $(`<button>inside</button>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('button', { includeShadowDom: true }).should('be.hidden')
          cy.wrap($host).find('button', { includeShadowDom: true }).should('not.be.visible')
        })

        it('reports descendant as hidden when an ancestor outside the shadow root has `display: none`', () => {
          const $wrap = $(`<div style="display: none;"><shadow-host></shadow-host></div>`).appendTo(cy.$$('body'))
          const host = $wrap.find('shadow-host')[0] as HTMLElement & { shadowRoot: ShadowRoot }

          $(`<button>inside</button>`).appendTo(host.shadowRoot)

          cy.wrap($wrap).find('button', { includeShadowDom: true }).should('be.hidden')
          cy.wrap($wrap).find('button', { includeShadowDom: true }).should('not.be.visible')
        })

        it('reports descendant as visible when shadow host and its ancestors are visible', () => {
          const $host = $(`<shadow-host></shadow-host>`).appendTo(cy.$$('body'))

          $(`<button>inside</button>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('button', { includeShadowDom: true }).should('be.visible')
          cy.wrap($host).find('button', { includeShadowDom: true }).should('not.be.hidden')
        })
      })

      // --- Slot scenarios -----------------------------------------------------------------------
      //
      // Legacy walks DOM parents, so it sees the shadow host but not the slot the light child
      // renders into. Modern uses checkVisibility(), which walks the flat tree and therefore sees
      // the slot. Tests below branch on `isModern` whenever the slot itself (rather than the host)
      // is what's hiding the content.

      describe('default slot', () => {
        it('reports a slotted light-DOM child as visible', () => {
          const $host = $(`<shadow-host><span class="slotted">light</span></shadow-host>`).appendTo(cy.$$('body'))

          $(`<slot></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('.slotted').should('be.visible')
          cy.wrap($host).find('.slotted').should('not.be.hidden')
        })

        it('reports a slotted child as hidden when host has `display: none`', () => {
          const $host = $(`<shadow-host style="display: none;"><span class="slotted">light</span></shadow-host>`).appendTo(cy.$$('body'))

          $(`<slot></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('.slotted').should('be.hidden')
          cy.wrap($host).find('.slotted').should('not.be.visible')
        })

        it('reports a slotted child as hidden by `display: none` on the slot', () => {
          // Slotted children that don't render have a zero-area bounding rect, so both
          // algorithms report hidden (modern via checkVisibility, legacy via its dim check).
          const $host = $(`<shadow-host><span class="slotted">light</span></shadow-host>`).appendTo(cy.$$('body'))

          $(`<slot style="display: none;"></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('.slotted').should('be.hidden')
          cy.wrap($host).find('.slotted').should('not.be.visible')
        })

        it('reports an unslotted light-DOM child as hidden when no slot exists for it', () => {
          // No <slot> in the shadow root — the light-DOM child has no flat-tree position
          // and zero bounding rect.
          const $host = $(`<shadow-host><span class="orphan">orphan</span></shadow-host>`).appendTo(cy.$$('body'))

          $(`<span>shadow-only</span>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('.orphan').should('be.hidden')
          cy.wrap($host).find('.orphan').should('not.be.visible')
        })

        it('reports default-slot fallback content as visible when no light-DOM child is assigned', () => {
          const $host = $(`<shadow-host></shadow-host>`).appendTo(cy.$$('body'))

          $(`<slot><span class="fallback">fallback</span></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('.fallback', { includeShadowDom: true }).should('be.visible')
          cy.wrap($host).find('.fallback', { includeShadowDom: true }).should('not.be.hidden')
        })
      })

      describe('named slot', () => {
        it('reports a named-slotted child as visible', () => {
          const $host = $(`<shadow-host><span class="named" slot="header">header content</span></shadow-host>`).appendTo(cy.$$('body'))

          $(`<slot name="header"></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('.named').should('be.visible')
          cy.wrap($host).find('.named').should('not.be.hidden')
        })

        it('reports a named-slotted child as hidden when its named slot has `display: none`', () => {
          const $host = $(`<shadow-host><span class="named" slot="header">header content</span></shadow-host>`).appendTo(cy.$$('body'))

          $(`<slot name="header" style="display: none;"></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('.named').should('be.hidden')
          cy.wrap($host).find('.named').should('not.be.visible')
        })

        it('reports a child with no matching slot name as hidden', () => {
          // light child uses slot="footer" but the shadow root only declares slot name="header"
          const $host = $(`<shadow-host><span class="mismatched" slot="footer">footer?</span></shadow-host>`).appendTo(cy.$$('body'))

          $(`<slot name="header"></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

          cy.wrap($host).find('.mismatched').should('be.hidden')
          cy.wrap($host).find('.mismatched').should('not.be.visible')
        })
      })

      describe('manual slot assignment', () => {
        it('reports a manually-assigned child as visible', () => {
          const $host = $(`<manual-slot-host><span class="m-child">manual</span></manual-slot-host>`).appendTo(cy.$$('body'))
          const host = $host[0] as HTMLElement & { shadowRoot: ShadowRoot }
          const slot = document.createElement('slot') as HTMLSlotElement

          host.shadowRoot.appendChild(slot)
          slot.assign($host.find('.m-child')[0])

          cy.wrap($host).find('.m-child').should('be.visible')
          cy.wrap($host).find('.m-child').should('not.be.hidden')
        })

        it('reports an unassigned light-DOM child as hidden', () => {
          const $host = $(`<manual-slot-host><span class="m-orphan">orphan</span></manual-slot-host>`).appendTo(cy.$$('body'))
          const host = $host[0] as HTMLElement & { shadowRoot: ShadowRoot }
          const slot = document.createElement('slot') as HTMLSlotElement

          host.shadowRoot.appendChild(slot)
          // intentionally do NOT assign anything to the slot

          cy.wrap($host).find('.m-orphan').should('be.hidden')
          cy.wrap($host).find('.m-orphan').should('not.be.visible')
        })

        it('reflects reassignment between manual slots', () => {
          const $host = $(`<manual-slot-host>
            <span class="m-a">A</span>
            <span class="m-b">B</span>
          </manual-slot-host>`).appendTo(cy.$$('body'))
          const host = $host[0] as HTMLElement & { shadowRoot: ShadowRoot }
          const slot = document.createElement('slot') as HTMLSlotElement

          host.shadowRoot.appendChild(slot)
          slot.assign($host.find('.m-a')[0])

          cy.wrap($host).find('.m-a').should('be.visible')
          cy.wrap($host).find('.m-a').should('not.be.hidden')
          cy.wrap($host).find('.m-b').should('be.hidden')
          cy.wrap($host).find('.m-b').should('not.be.visible')

          cy.then(() => {
            slot.assign($host.find('.m-b')[0])
          })

          cy.wrap($host).find('.m-a').should('be.hidden')
          cy.wrap($host).find('.m-a').should('not.be.visible')
          cy.wrap($host).find('.m-b').should('be.visible')
          cy.wrap($host).find('.m-b').should('not.be.hidden')
        })
      })

      describe('width and height', () => {
        it('parent is shadow root and has overflow: hidden and no width', () => {
          const $shadowRootNoWidth = add(
        `<shadow-root id="shadow-root-no-width" style='width: 0; height: 100px; overflow: hidden;'></shadow-root>`,
        `<div style='height: 500px; width: 500px;'>
          <span>parent width: 0</span>
        </div>`,
        '#shadow-root-no-width',
          )

          cy.wrap($shadowRootNoWidth).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($shadowRootNoWidth).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent outside of shadow dom has overflow: hidden and no width', () => {
          const $outsideParentNoWidth = add(
        `<div style='width: 0; height: 100px; overflow: hidden;'>
          <shadow-root id="outside-parent-no-width"></shadow-root>
        </div>`,
        `<div style='height: 500px; width: 500px;'>
          <span>parent width: 0</span>
        </div>`,
        '#outside-parent-no-width',
          )

          cy.wrap($outsideParentNoWidth).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($outsideParentNoWidth).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent is shadow root and has overflow: hidden and no height', () => {
          const $shadowRootNoHeight = add(
        `<shadow-root id="shadow-root-no-height" style='width: 100px; height: 0; overflow: hidden;'></shadow-root>`,
        `<div style='height: 500px; width: 500px;'>
          <span>parent height: 0</span>
        </div>`,
        '#shadow-root-no-height',
          )

          cy.wrap($shadowRootNoHeight).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($shadowRootNoHeight).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent outside of shadow dom has overflow: hidden and no height', () => {
          const $outsideParentNoHeight = add(
        `<div style='width: 100px; height: 0; overflow: hidden;'>
          <shadow-root id="outside-parent-no-height"></shadow-root>
        </div>`,
        `<div style='height: 500px; width: 500px;'>
          <span>parent height: 0</span>
        </div>`,
        '#outside-parent-no-height',
          )

          cy.wrap($outsideParentNoHeight).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($outsideParentNoHeight).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
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

        it('is hidden if position: fixed and covered by element outside of shadow dom (legacy only)', () => {
          const $coveredUpByOutsidePosFixed = add(
        `<div>
          <shadow-root id="covered-up-by-outside-pos-fixed"></shadow-root>
          <div style="position: fixed; bottom: 0; left: 0">on top</div>
        </div>`,
        `<div id="inside-underneath" style="position: fixed; bottom: 0; left: 0">underneath</div>`,
        '#covered-up-by-outside-pos-fixed',
          )

          cy.wrap($coveredUpByOutsidePosFixed).find('#inside-underneath', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($coveredUpByOutsidePosFixed).find('#inside-underneath', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('is hidden if outside of shadow dom with position: fixed and covered by element inside of shadow dom (legacy only)', () => {
          const $coveredUpByShadowPosFixed = add(
        `<div>
          <div id="outside-underneath" style="position: fixed; bottom: 0; left: 0">underneath</div>
          <shadow-root id="covered-up-by-shadow-pos-fixed"></shadow-root>
        </div>`,
        `<div style="position: fixed; bottom: 0; left: 0">on top</div>`,
        '#covered-up-by-shadow-pos-fixed',
          )

          cy.wrap($coveredUpByShadowPosFixed).find('#outside-underneath', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($coveredUpByShadowPosFixed).find('#outside-underneath', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
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

        it('is hidden if covered when position: fixed and parent outside shadow dom has pointer-events: none (legacy only)', () => {
          const $parentPointerEventsNoneCovered = add(
        `<div style="pointer-events: none;">
          <shadow-root id="parent-pointer-events-none-covered"></shadow-root>
        </div>
        <span style="position: fixed; top: 40px; background: red;">covering the element with pointer-events: none</span>`,
        `<span style="position: fixed; top: 40px;">parent pointer-events: none</span>`,
        '#parent-pointer-events-none-covered',
          )

          cy.wrap($parentPointerEventsNoneCovered).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($parentPointerEventsNoneCovered).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
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

      // All tests in this block exercise legacy's ancestor-overflow walking. Modern considers them
      // visible because checkVisibility() doesn't walk ancestor overflow.
      describe('css overflow', () => {
        it('parent outside of shadow dom overflow hidden and out of bounds to left', () => {
          const $elOutOfParentBoundsToLeft = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-bounds-to-left"></shadow-root>
        </div>`,
        `<span style='position: absolute; width: 100px; height: 100px; left: -100px; top: 0;'>position: absolute, out of bounds left</span>`,
        '#el-out-of-parent-bounds-to-left',
          )

          cy.wrap($elOutOfParentBoundsToLeft).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfParentBoundsToLeft).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent outside of shadow dom overflow hidden and out of bounds to right', () => {
          const $elOutOfParentBoundsToRight = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-bounds-to-right"></shadow-root>
        </div>`,
        `<span style='position: absolute; width: 100px; height: 100px; right: -100px; top: 0;'>position: absolute, out of bounds right</span>`,
        '#el-out-of-parent-bounds-to-right',
          )

          cy.wrap($elOutOfParentBoundsToRight).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfParentBoundsToRight).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent outside of shadow dom overflow hidden and out of bounds above', () => {
          const $elOutOfParentBoundsAbove = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-bounds-above"></shadow-root>
        </div>`,
        `<span style='position: absolute; width: 100px; height: 100px; top: -100px; left: 0;'>position: absolute, out of bounds above</span>`,
        '#el-out-of-parent-bounds-above',
          )

          cy.wrap($elOutOfParentBoundsAbove).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfParentBoundsAbove).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent outside of shadow dom overflow hidden and out of bounds below', () => {
          const $elOutOfParentBoundsBelow = add(
        `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-bounds-below"></shadow-root>
        </div>`,
        `<span style='position: absolute; width: 100px; height: 100px; bottom: -100px; left: 0;'>position: absolute, out of bounds below</span>`,
        '#el-out-of-parent-bounds-below',
          )

          cy.wrap($elOutOfParentBoundsBelow).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfParentBoundsBelow).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent outside of shadow dom overflow hidden-y and out of bounds', () => {
          const $elOutOfParentWithOverflowYHiddenBounds = add(
        `<div style='width: 100px; height: 100px; overflow-y: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-with-overflow-y-hidden-bounds"></shadow-root>
        </div>`,
        `<span style='position: absolute; top: 200px; left: 0;'>position: absolute, out of bounds below</span>`,
        '#el-out-of-parent-with-overflow-y-hidden-bounds',
          )

          cy.wrap($elOutOfParentWithOverflowYHiddenBounds).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfParentWithOverflowYHiddenBounds).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent outside of shadow dom overflow hidden-x and out of bounds', () => {
          const $elOutOfParentWithOverflowXHiddenBounds = add(
        `<div style='width: 100px; height: 100px; overflow-x: hidden; position: relative;'>
          <shadow-root id="el-out-of-parent-with-overflow-x-hidden-bounds"></shadow-root>
        </div>`,
        `<span style='position: absolute; top: 0; left: 200px;'>position: absolute, out of bounds below</span>`,
        '#el-out-of-parent-with-overflow-x-hidden-bounds',
          )

          cy.wrap($elOutOfParentWithOverflowXHiddenBounds).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfParentWithOverflowXHiddenBounds).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
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

        it('parent is wide and ancestor outside shadow dom is overflow auto', () => {
          const $elOutOfAncestorOverflowAutoBoundsOutside = add(
        `<div style='width: 100px; height: 100px; overflow: auto;'>
          <div style='width: 1000px; position: relative;'>
            <shadow-root id="el-out-of-ancestor-overflow-auto-bounds-outside"></shadow-root>
          </div>
        </div>`,
        `<span style='position: absolute; left: 300px; top: 0px;'>out of bounds, parent wide, ancestor overflow: auto</span>`,
        '#el-out-of-ancestor-overflow-auto-bounds-outside',
          )

          cy.wrap($elOutOfAncestorOverflowAutoBoundsOutside).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfAncestorOverflowAutoBoundsOutside).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent is wide and ancestor inside shadow dom is overflow auto', () => {
          const $elOutOfAncestorOverflowAutoBoundsInside = add(
        `<div style='width: 100px; height: 100px; overflow: auto;'>
          <shadow-root id="el-out-of-ancestor-overflow-auto-bounds-inside"></shadow-root>
        </div>`,
        `<div style='width: 1000px; position: relative;'>
          <span style='position: absolute; left: 300px; top: 0px;'>out of bounds, parent wide, ancestor overflow: auto</span>
        </div>`,
        '#el-out-of-ancestor-overflow-auto-bounds-inside',
          )

          cy.wrap($elOutOfAncestorOverflowAutoBoundsInside).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfAncestorOverflowAutoBoundsInside).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent outside of shadow dom has overflow scroll and out of bounds', () => {
          const $elOutOfScrollingParentBounds = add(
        `<div style='width: 100px; height: 100px; overflow: scroll; position: relative; top: 700px; left: 700px;'>
          <shadow-root id="el-out-of-scrolling-parent-bounds"></shadow-root>
        </div>`,
        `<span style='position: absolute; left: 300px; top: 0;'>out of scrolling bounds, position: absolute</span>`,
        '#el-out-of-scrolling-parent-bounds',
          )

          cy.wrap($elOutOfScrollingParentBounds).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfScrollingParentBounds).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('parent absolutely positioned and overflow hidden and out of bounds', () => {
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

          cy.wrap($elOutOfPosAbsParentBounds).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elOutOfPosAbsParentBounds).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
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

        it('relatively positioned outside of ancestor outside shadow dom with overflow hidden', () => {
          const $elIsRelativeAndOutOfBoundsOfAncestorOverflow = add(
        `<div style='overflow: hidden;'>
          <div>
            <shadow-root id="el-is-relative-and-out-of-bounds-of-ancestor-overflow"></shadow-root>
          </div>
        </div>`,
        `<span style='position: relative; left: 0; top: -200px;'>out of bounds, position: relative</span>`,
        '#el-is-relative-and-out-of-bounds-of-ancestor-overflow',
          )

          cy.wrap($elIsRelativeAndOutOfBoundsOfAncestorOverflow).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($elIsRelativeAndOutOfBoundsOfAncestorOverflow).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
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

        it('is visible when element is statically positioned and parent element is absolutely positioned and ancestor has overflow hidden', function () {
          const el = add(
        `<div id="breaking-container" style="overflow: hidden">
          <div>
            <shadow-root id="shadow"></shadow-root>
          </div>
        </div>`,
        `<div style="position: absolute; bottom: 5px">
          <button id="visible-button">Try me</button>
        </div>`,
        '#shadow',
          )

          cy.wrap(el).find('#visible-button', { includeShadowDom: true }).should('be.visible')
          cy.wrap(el).find('#visible-button', { includeShadowDom: true }).should('not.be.hidden')
        })

        it('is visible when element is relatively positioned and parent element is absolutely positioned and ancestor has overflow auto', function () {
          const el = add(
        `<div style="height: 200px; position: relative; display: flex">
          <div style="border: 5px solid red">
            <div
              id="breaking-container"
              style="overflow: auto; border: 5px solid green"
            >
              <div>
                <h1>Example</h1>
                <shadow-root id="shadow"></shadow-root>
              </div>
            </div>
          </div>
        </div>`,
        `<div style="position: absolute; bottom: 5px">
          <button id="visible-button">Try me</button>
        </div>`,
        '#shadow',
          )

          cy.wrap(el).find('#visible-button', { includeShadowDom: true }).should('be.visible')
          cy.wrap(el).find('#visible-button', { includeShadowDom: true }).should('not.be.hidden')
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

        it('out of ancestor bounds due to ancestor within shadow dom transform', () => {
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

          cy.wrap($ancestorInsideTransformMakesElOutOfBoundsOfAncestor).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($ancestorInsideTransformMakesElOutOfBoundsOfAncestor).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })

        it('out of ancestor bounds due to ancestor outside shadow dom transform', () => {
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

          cy.wrap($ancestorOutsideTransformMakesElOutOfBoundsOfAncestor).find('span', { includeShadowDom: true }).should(isModern ? 'be.visible' : 'be.hidden')
          cy.wrap($ancestorOutsideTransformMakesElOutOfBoundsOfAncestor).find('span', { includeShadowDom: true }).should(isModern ? 'not.be.hidden' : 'not.be.visible')
        })
      })
    })
  }
})
