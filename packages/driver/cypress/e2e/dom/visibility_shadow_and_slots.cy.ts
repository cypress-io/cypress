export {} // make typescript see this as a module

const { $ } = Cypress

// Coverage for the experimental fast visibility algorithm (`experimentalFastVisibility: true`),
// which delegates to `Element.checkVisibility()` + a zero-dimension guard. These tests cover
// scenarios where the fast algorithm walks the flat tree (Shadow DOM, slots) and edge cases that
// the native API handles directly (display: contents, content-visibility, <details>, <template>).
describe('src/cypress/dom/visibility - fast algorithm: shadow dom, slots, edge cases', {
  experimentalFastVisibility: true,
}, () => {
  beforeEach(() => {
    cy.visit('/fixtures/empty.html').then((win) => {
      // Default to `display: block` via shadow CSS instead of inline style so that inline
      // `style="display: none"` on the host element wins (inline > :host).
      const installDefaultDisplay = (root: ShadowRoot, doc: Document) => {
        const style = doc.createElement('style')

        style.textContent = ':host { display: block; }'
        root.appendChild(style)
      }

      // open shadow root that uses default named-slot assignment
      win.customElements.define('shadow-host', class extends win.HTMLElement {
        constructor () {
          super()
          installDefaultDisplay(this.attachShadow({ mode: 'open' }), this.ownerDocument)
        }
      })

      // open shadow root that uses manual slot assignment
      win.customElements.define('manual-slot-host', class extends win.HTMLElement {
        constructor () {
          super()
          installDefaultDisplay(this.attachShadow({ mode: 'open', slotAssignment: 'manual' }), this.ownerDocument)
        }
      })
    })
  })

  describe('light DOM edge cases', () => {
    it('reports `display: contents` element as hidden (no layout box)', () => {
      const $el = $(`<div style="display: contents;">contents</div>`).appendTo(cy.$$('body'))

      cy.wrap($el).should('not.be.visible')
      cy.wrap($el).should('be.hidden')
    })

    it('reports child of `display: contents` parent as visible', () => {
      const $parent = $(`<div style="display: contents;"><span>child</span></div>`).appendTo(cy.$$('body'))

      cy.wrap($parent.find('span')).should('be.visible')
    })

    it('reports `content-visibility: hidden` element as hidden', () => {
      const $el = $(`<div style="content-visibility: hidden;">cv hidden</div>`).appendTo(cy.$$('body'))

      cy.wrap($el).should('be.hidden')
      cy.wrap($el).should('not.be.visible')
    })

    it('reports descendant of `content-visibility: hidden` parent as hidden', () => {
      const $parent = $(`<div style="content-visibility: hidden;"><span>child</span></div>`).appendTo(cy.$$('body'))

      cy.wrap($parent.find('span')).should('not.be.visible')
    })

    it('reports descendant of closed <details> as hidden', () => {
      const $details = $(`<details><summary>summary</summary><p>body content</p></details>`).appendTo(cy.$$('body'))

      cy.wrap($details.find('p')).should('be.hidden')
      cy.wrap($details.find('summary')).should('be.visible')
    })

    it('reports descendant of open <details> as visible', () => {
      const $details = $(`<details open><summary>summary</summary><p>body content</p></details>`).appendTo(cy.$$('body'))

      cy.wrap($details.find('p')).should('be.visible')
    })

    it('reports element inside a <template> as hidden', () => {
      const $template = $(`<template><div id="in-template">never rendered</div></template>`).appendTo(cy.$$('body'))
      // Templates own a separate document fragment with no layout. Walk into the content fragment.
      const inTemplate = ($template[0] as HTMLTemplateElement).content.querySelector('#in-template')

      expect(Cypress.dom.isHidden(inTemplate as HTMLElement)).to.be.true
    })

    it('respects the zero-dimension guard for elements with `width: 0; height: 0`', () => {
      const $el = $(`<div style="width: 0; height: 0;">zero</div>`).appendTo(cy.$$('body'))

      cy.wrap($el).should('be.hidden')
      cy.wrap($el).should('not.be.visible')
    })

    it('respects the zero-dimension guard for single-axis zero (`width: 0; height: 100px`)', () => {
      const $el = $(`<div style="width: 0; height: 100px;">single-axis zero</div>`).appendTo(cy.$$('body'))

      cy.wrap($el).should('be.hidden')
      cy.wrap($el).should('not.be.visible')
    })

    it('reports `inert` element as visible (inert affects interactivity, not layout)', () => {
      const $el = $(`<div inert style="width: 100px; height: 100px;">inert</div>`).appendTo(cy.$$('body'))

      cy.wrap($el).should('be.visible')
    })

    it('reports `aria-hidden="true"` element as visible (semantics, not rendering)', () => {
      const $el = $(`<div aria-hidden="true" style="width: 100px; height: 100px;">aria</div>`).appendTo(cy.$$('body'))

      cy.wrap($el).should('be.visible')
    })
  })

  describe('shadow DOM (CSS hiding propagates across the flat tree)', () => {
    it('reports descendant as hidden when shadow host has `display: none`', () => {
      const $host = $(`<shadow-host style="display: none;"></shadow-host>`).appendTo(cy.$$('body'))

      $(`<button>inside</button>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('button', { includeShadowDom: true }).should('be.hidden')
      cy.wrap($host).find('button', { includeShadowDom: true }).should('not.be.visible')
    })

    it('reports descendant as hidden when shadow host has `visibility: hidden`', () => {
      const $host = $(`<shadow-host style="visibility: hidden;"></shadow-host>`).appendTo(cy.$$('body'))

      $(`<button>inside</button>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('button', { includeShadowDom: true }).should('be.hidden')
    })

    it('reports descendant as hidden when shadow host has `opacity: 0`', () => {
      const $host = $(`<shadow-host style="opacity: 0;"></shadow-host>`).appendTo(cy.$$('body'))

      $(`<button>inside</button>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('button', { includeShadowDom: true }).should('be.hidden')
    })

    it('reports descendant as hidden when an ancestor outside the shadow root has `display: none`', () => {
      const $wrap = $(`<div style="display: none;"><shadow-host></shadow-host></div>`).appendTo(cy.$$('body'))
      const host = $wrap.find('shadow-host')[0] as HTMLElement & { shadowRoot: ShadowRoot }

      $(`<button>inside</button>`).appendTo(host.shadowRoot)

      cy.wrap($wrap).find('button', { includeShadowDom: true }).should('be.hidden')
    })

    it('reports descendant as visible when shadow host and its ancestors are visible', () => {
      const $host = $(`<shadow-host></shadow-host>`).appendTo(cy.$$('body'))

      $(`<button>inside</button>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('button', { includeShadowDom: true }).should('be.visible')
    })
  })

  describe('default slot', () => {
    it('reports a slotted light-DOM child as visible', () => {
      const $host = $(`<shadow-host><span class="slotted">light</span></shadow-host>`).appendTo(cy.$$('body'))

      $(`<slot></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('.slotted').should('be.visible')
    })

    it('reports a slotted child as hidden when host has `display: none`', () => {
      const $host = $(`<shadow-host style="display: none;"><span class="slotted">light</span></shadow-host>`).appendTo(cy.$$('body'))

      $(`<slot></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('.slotted').should('be.hidden')
    })

    it('reports a slotted child as hidden when the slot itself has `display: none`', () => {
      const $host = $(`<shadow-host><span class="slotted">light</span></shadow-host>`).appendTo(cy.$$('body'))

      $(`<slot style="display: none;"></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('.slotted').should('be.hidden')
    })

    it('reports an unslotted light-DOM child as hidden when no slot exists for it', () => {
      // No <slot> in the shadow root — the light-DOM child has no flat-tree position to render at.
      const $host = $(`<shadow-host><span class="orphan">orphan</span></shadow-host>`).appendTo(cy.$$('body'))

      $(`<span>shadow-only</span>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('.orphan').should('be.hidden')
    })

    it('reports default-slot fallback content as visible when no light-DOM child is assigned', () => {
      const $host = $(`<shadow-host></shadow-host>`).appendTo(cy.$$('body'))

      $(`<slot><span class="fallback">fallback</span></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('.fallback', { includeShadowDom: true }).should('be.visible')
    })
  })

  describe('named slot', () => {
    it('reports a named-slotted child as visible', () => {
      const $host = $(`<shadow-host><span class="named" slot="header">header content</span></shadow-host>`).appendTo(cy.$$('body'))

      $(`<slot name="header"></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('.named').should('be.visible')
    })

    it('reports a named-slotted child as hidden when its named slot has `display: none`', () => {
      const $host = $(`<shadow-host><span class="named" slot="header">header content</span></shadow-host>`).appendTo(cy.$$('body'))

      $(`<slot name="header" style="display: none;"></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('.named').should('be.hidden')
    })

    it('reports a child with no matching slot name as hidden', () => {
      // light child uses slot="footer" but the shadow root only declares slot name="header"
      const $host = $(`<shadow-host><span class="mismatched" slot="footer">footer?</span></shadow-host>`).appendTo(cy.$$('body'))

      $(`<slot name="header"></slot>`).appendTo(($host[0] as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot)

      cy.wrap($host).find('.mismatched').should('be.hidden')
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
    })

    it('reports an unassigned light-DOM child as hidden', () => {
      const $host = $(`<manual-slot-host><span class="m-orphan">orphan</span></manual-slot-host>`).appendTo(cy.$$('body'))
      const host = $host[0] as HTMLElement & { shadowRoot: ShadowRoot }
      const slot = document.createElement('slot') as HTMLSlotElement

      host.shadowRoot.appendChild(slot)
      // intentionally do NOT assign anything to the slot

      cy.wrap($host).find('.m-orphan').should('be.hidden')
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
      cy.wrap($host).find('.m-b').should('be.hidden')

      cy.then(() => {
        slot.assign($host.find('.m-b')[0])
      })

      cy.wrap($host).find('.m-a').should('be.hidden')
      cy.wrap($host).find('.m-b').should('be.visible')
    })
  })
})
