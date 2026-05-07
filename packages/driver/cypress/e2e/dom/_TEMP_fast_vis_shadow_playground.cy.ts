// TEMPORARY playground for poking at experimentalFastVisibility + Shadow DOM.
// Pairs with cypress-io/cypress#33046 / #33737. Delete when no longer needed.
//
// Run in `cypress open` and pick this spec. Each example renders its own DOM
// in the AUT and asserts visibility under both `fast` and `legacy` so you can
// flip between the two and see the difference. The assertions match what
// visibility_shadow_dom.cy.ts asserts; the fixtures are duplicated here so the
// runner shows them in isolation rather than scrolled past in a 60+ test list.

export {} // make typescript see this as a module

const { $ } = Cypress

const buildAdd = (win: Window) => {
  if (!(win.customElements as any).get('playground-host')) {
    win.customElements.define('playground-host', class extends win.HTMLElement {
      constructor () {
        super()
        this.attachShadow({ mode: 'open' })
        this.style.display = 'block'
      }
    })
  }

  return (lightHTML: string, shadowHTML: string, hostSelector: string) => {
    const $light = $(lightHTML).appendTo(cy.$$('body'))

    $(shadowHTML).appendTo(cy.$$(hostSelector)[0].shadowRoot!)

    return $light
  }
}

describe('fast visibility + Shadow DOM playground', () => {
  let add: (lightHTML: string, shadowHTML: string, hostSelector: string) => JQuery<HTMLElement>

  for (const mode of ['fast', 'legacy']) {
    describe(`${mode} mode`, {
      experimentalFastVisibility: mode === 'fast',
    }, () => {
      beforeEach(() => {
        cy.visit('/fixtures/empty.html').then((win) => {
          add = buildAdd(win)

          // Match visibility_shadow_dom.cy.ts: ensure body is scrollable and
          // already scrolled, so layout/scroll quirks surface the way they do
          // in real apps.
          const $sentinel = $(`<div style='height: 1000px; width: 10px;'></div><div>Should be in view</div>`).appendTo(cy.$$('body'))

          $sentinel.get(1).scrollIntoView()
        })
      })

      describe('✅ now works under fast (regressions fixed by #33737)', () => {
        it('hides shadow content when its host is `visibility: hidden`', () => {
          const $host = add(
            `<playground-host id="host-vis-hidden" style="visibility: hidden;"></playground-host>`,
            `<button>I should be hidden</button>`,
            '#host-vis-hidden',
          )

          cy.wrap($host).find('button', { includeShadowDom: true }).should('be.hidden')
        })

        it('shows shadow span at abs(50,50) inside an overflow:hidden 200×200 box (in-bounds, below the fold)', () => {
          // This was test 5 — un-skipped by the in-bounds smart-clipping change.
          const $light = add(
            `<div style='width: 200px; height: 200px; overflow: hidden; position: relative;'>
              <div style='position: absolute;'>
                <playground-host id="host-in-bounds-below-fold"></playground-host>
              </div>
            </div>`,
            `<span style='position: absolute; left: 50px; top: 50px;'>in bounds</span>`,
            '#host-in-bounds-below-fold',
          )

          cy.wrap($light).find('span', { includeShadowDom: true }).should('be.visible')
        })

        it('hides shadow content positioned out-of-bounds of an overflow:hidden parent', () => {
          // One of the three CI regressions fixed by walking shadow boundaries
          // in hasClippingAncestor.
          const $light = add(
            `<div style='width: 100px; height: 100px; overflow: hidden; position: relative;'>
              <playground-host id="host-out-of-bounds-below"></playground-host>
            </div>`,
            `<span style='position: absolute; width: 100px; height: 100px; bottom: -100px; left: 0;'>clipped, you should not see me</span>`,
            '#host-out-of-bounds-below',
          )

          cy.wrap($light).find('span', { includeShadowDom: true }).should('be.hidden')
        })

        it('hides shadow content out-of-bounds of an overflow:scroll parent', () => {
          // The Firefox-specific CI regression — fixed by including scroll/auto
          // in CLIPPING_OVERFLOW.
          const $light = add(
            `<div style='width: 100px; height: 100px; overflow: scroll; position: relative; top: 700px; left: 700px;'>
              <playground-host id="host-overflow-scroll-out-of-bounds"></playground-host>
            </div>`,
            `<span style='position: absolute; left: 300px; top: 0;'>I am off-screen of an overflow:scroll container</span>`,
            '#host-overflow-scroll-out-of-bounds',
          )

          cy.wrap($light).find('span', { includeShadowDom: true }).should('be.hidden')
        })

        it('finds shadow content via the shadow-aware ancestor walk (was: el.contains)', () => {
          // visibleAtPoint's contains check now uses findParent which crosses
          // shadow boundaries. Without this change, fast would have reported
          // the button as hidden even when document.elementFromPoint correctly
          // returned the host.
          const $light = add(
            `<playground-host id="host-shadow-aware-contains"></playground-host>`,
            `<button style="position: fixed; top: 30px; left: 30px;">I am rendered, please find me</button>`,
            '#host-shadow-aware-contains',
          )

          cy.wrap($light).find('button', { includeShadowDom: true }).should('be.visible')
        })
      })

      describe('⚠️ still skipped under fast (documented divergences)', () => {
        // Each of these PASSES under legacy and FAILS under fast for the
        // reasons explained in the comment in visibility_shadow_dom.cy.ts.
        // Skipped under fast so CI stays green. To watch fast turn red live in
        // cypress open, flip `itDivergent` to `it` below for the run.
        const itDivergent = mode === 'fast' ? it.skip : it

        itDivergent('test 1: shadow underneath wider than its outside cover (cover-width mismatch)', () => {
          const $light = add(
            `<div>
              <playground-host id="host-narrow-cover"></playground-host>
              <div style="position: fixed; bottom: 0; left: 0; background: rgba(255, 0, 0, 0.5);">on top</div>
            </div>`,
            `<div id="inside-underneath" style="position: fixed; bottom: 0; left: 0; background: lightblue;">underneath</div>`,
            '#host-narrow-cover',
          )

          cy.wrap($light).find('#inside-underneath', { includeShadowDom: true }).should('be.hidden')
        })

        itDivergent('test 3: shadow span with `position: fixed` whose host parent has `pointer-events: none`', () => {
          const $light = add(
            `<div style="pointer-events: none;">
              <playground-host id="host-pe-none-parent"></playground-host>
            </div>`,
            `<span style="position: fixed; top: 20px;">I am rendered but elementFromPoint skips me</span>`,
            '#host-pe-none-parent',
          )

          cy.wrap($light).find('span', { includeShadowDom: true }).should('be.visible')
        })

        itDivergent('test 4: shadow span with `pointer-events: none` whose host parent is fixed', () => {
          const $light = add(
            `<div style="position: fixed; top: 60px;">
              <playground-host id="host-pe-none-span"></playground-host>
            </div>`,
            `<span style="pointer-events: none;">I am rendered but elementFromPoint skips me</span>`,
            '#host-pe-none-span',
          )

          cy.wrap($light).find('span', { includeShadowDom: true }).should('be.visible')
        })

        itDivergent('test 8: clipping ancestor sits between the subject and its containing block', () => {
          // outer (relative) is the abs button's containing block. The
          // overflow:auto breaking-container in between would only clip the
          // button per a strict descendant-clips reading; legacy's
          // canClipContent uses `offsetParent` rules to ignore it.
          const $light = add(
            `<div style="height: 200px; position: relative; display: flex">
              <div style="border: 5px solid red">
                <div id="breaking-container" style="overflow: auto; border: 5px solid green">
                  <div>
                    <h1>Example</h1>
                    <playground-host id="host-clipper-between-cb"></playground-host>
                  </div>
                </div>
              </div>
            </div>`,
            `<div style="position: absolute; bottom: 5px">
              <button id="visible-button">Try me</button>
            </div>`,
            '#host-clipper-between-cb',
          )

          cy.wrap($light).find('#visible-button', { includeShadowDom: true }).should('be.visible')
        })
      })
    })
  }
})
