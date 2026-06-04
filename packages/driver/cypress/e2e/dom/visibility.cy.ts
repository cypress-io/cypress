// @ts-ignore
const { $, dom } = Cypress

describe('src/cypress/dom/visibility', {
  slowTestThreshold: 500,
}, () => {
  function assertVisibilityForEl (el: HTMLElement) {
    const breakingChangeExpectedProp = Cypress.config('visibilityStrategy') === 'modern' ? 'cy-modern-expect' : 'cy-legacy-expect'
    const expected = el.getAttribute('cy-expect') ?? el.getAttribute(breakingChangeExpectedProp)

    if (!expected) {
      throw new Error(`Expected attribute 'cy-expect' or 'cy-legacy-expect' not found on test case_ element ${el.outerHTML}`)
    }

    expect(
      $(el).is(`:${expected}`),
      `${el.getAttribute('cy-label') ?? el.textContent ?? 'empty text content'} should be ${expected}`,
    ).to.be.true

    expect(el).to.be[expected]

    cy.wrap(el).should(`be.${expected}`)

    const opposite = expected === 'hidden' ? 'visible' : 'hidden'

    expect(
      $(el).is(`:${opposite}`),
      `${el.getAttribute('cy-label') ?? el.textContent ?? 'empty text content'} should not be ${opposite}`,
    ).to.be.false

    expect(el).to.not.be[opposite]

    cy.wrap(el).should(`not.be.${opposite}`)
  }

  function prepareFixtureSection (section: string) {
    cy.get('.test-section').each((el) => el.removeClass('active'))
    cy.get(`[cy-section="${section}"]`).then((el) => el.addClass('active'))
    cy.get(`[cy-section="${section}"]`).scrollIntoView()
  }

  function assertVisibilityForSections (sections: (string | undefined)[]) {
    for (const section of sections) {
      if (!section) {
        continue
      }

      it(`detects visibility for ${section} test cases`, () => {
        prepareFixtureSection(section)
        cy.get(`[cy-section="${section}"] .testCase`).then((els) => {
          els.get().forEach(assertVisibilityForEl)
        })
      })
    }
  }

  const modes: ('modern' | 'legacy')[] = ['modern', 'legacy']

  for (const mode of modes) {
    describe(`${mode}`, {
      visibilityStrategy: mode,
    }, () => {
      beforeEach(() => {
        cy.visit('/fixtures/generic.html')
      })

      context('isHidden', () => {
        it('exposes isHidden', () => {
          expect(dom.isHidden).to.be.a('function')
        })

        it('throws when not passed a DOM element', () => {
          const fn = () => {
            dom.isHidden(null!)
          }

          expect(fn).to.throw('`Cypress.dom.isHidden()` failed because it requires a DOM element. The subject received was: `null`')
        })
      })

      context('isVisible', () => {
        it('exposes isVisible', () => {
          expect(dom.isVisible).to.be.a('function')
        })

        it('throws when not passed a DOM element', () => {
          const fn = () => {
            // @ts-ignore
            dom.isVisible('form')
          }

          expect(fn).to.throw('`Cypress.dom.isVisible()` failed because it requires a DOM element. The subject received was: `form`')
        })
      })

      context('#isScrollable', () => {
        beforeEach(function () {
          this.add = (el) => {
            return $(el).appendTo(cy.$$('body'))
          }
        })

        it('returns true if window and body > window height', function () {
          this.add('<div style="height: 1000px; width: 10px;" />')
          const win = cy.state('window')

          const fn = () => {
            return dom.isScrollable(win)
          }

          expect(fn()).to.be.true
        })

        it('returns false if window and body < window height', () => {
          cy.$$('body').html('<div>foo</div>')

          const win = cy.state('window')

          const fn = () => {
            return dom.isScrollable(win)
          }

          expect(fn()).to.be.false
        })

        it('returns true if document element and body > window height', function () {
          this.add('<div style="height: 1000px; width: 10px;" />')
          const documentElement = Cypress.dom.wrap(cy.state('document').documentElement)

          const fn = () => {
            return dom.isScrollable(documentElement)
          }

          expect(fn()).to.be.true
        })

        it('returns false if document element and body < window height', () => {
          cy.$$('body').html('<div>foo</div>')

          const documentElement = Cypress.dom.wrap(cy.state('document').documentElement)

          const fn = () => {
            return dom.isScrollable(documentElement)
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
            return dom.isScrollable(noScroll)
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
            return dom.isScrollable(noOverflow)
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
            return dom.isScrollable(vertScrollable)
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
            return dom.isScrollable(horizScrollable)
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
            return dom.isScrollable(forcedScroll)
          }

          expect(fn()).to.be.true
        })
      })

      describe('visibility scenarios', () => {
        // The legacy strategy always treats <html>/<body> as visible. The modern
        // strategy does not special-case them: they obey checkVisibility and the
        // 0-dimension rule like any other element.
        describe('html and body overrides', () => {
          const rootExpectation = mode === 'legacy' ? 'visible' : 'hidden'

          const assertRoot = (selector: 'html' | 'body', expected: 'visible' | 'hidden') => {
            const opposite = expected === 'visible' ? 'hidden' : 'visible'

            expect(cy.$$(selector).is(`:${expected}`), `${selector} should be :${expected}`).to.be.true
            expect(cy.$$(selector).is(`:${opposite}`), `${selector} should not be :${opposite}`).to.be.false

            expect(cy.$$(selector)).to.be[expected]
            expect(cy.$$(selector)).to.not.be[opposite]

            cy.wrap(cy.$$(selector)).should(`be.${expected}`)
            cy.wrap(cy.$$(selector)).should(`not.be.${opposite}`)
          }

          beforeEach(() => {
            cy.visit('/fixtures/empty.html')
          })

          describe('when display none', () => {
            beforeEach(() => {
              cy.get('html').then(($el) => {
                $el.css('display', 'none')
              })

              cy.get('body').then(($el) => {
                $el.css('display', 'none')
              })
            })

            it(`is ${rootExpectation}`, () => {
              assertRoot('html', rootExpectation)
              assertRoot('body', rootExpectation)
            })
          })

          describe('when empty', () => {
            it(`body is ${rootExpectation}`, () => {
              assertRoot('body', rootExpectation)
            })
          })

          describe('when it has rendered dimensions', () => {
            beforeEach(() => {
              cy.get('body').invoke('html', '<div style="width: 100px; height: 100px;">content</div>')
            })

            it('is visible', () => {
              assertRoot('html', 'visible')
              assertRoot('body', 'visible')
            })
          })
        })

        describe('basic CSS properties', () => {
          beforeEach(() => {
            cy.visit('/fixtures/visibility/basic-css-properties.html')
          })

          assertVisibilityForSections([
            'visibility-property',
            'display-property',
            'opacity-property',
            'table-elements',
            'box-interactions',
          ])
        })

        describe('form elements', () => {
          beforeEach(() => {
            cy.visit('/fixtures/visibility/form-elements.html')
          })

          assertVisibilityForSections([
            'select-and-option-elements',
            'optgroup-elements',
            'options-outside-select',
            'hidden-options-within-visible-select',
            'input-elements',
          ])
        })

        describe('overflow', () => {
          beforeEach(() => {
            cy.visit('/fixtures/visibility/overflow.html')
          })

          assertVisibilityForSections([
            'zero-dimensions-with-overflow-hidden',
            'text-content-with-zero-dimensions',
            'positive-dimensions-with-overflow-hidden',
            'overflow-auto-with-zero-dimensions',
            'mixed-dimension-scenarios',
            'overflow-hidden',
            'overflow-y-hidden',
            'overflow-x-hidden',
            'overflow-auto-scenarios',
            'overflow-scroll-scenarios',
            'overflow-relative-positioning',
            'overflow-flex-container',
            'overflow-complex-scenarios',
            'clip-path-scenarios',
          ])
        })

        describe('positioning', () => {
          beforeEach(() => {
            cy.visit('/fixtures/visibility/positioning.html')
          })

          assertVisibilityForSections([
            'position-fixed-element-covered-by-another',
            'static-ancestor-fixed-descendant',
            'static-parent-fixed-child',
            'positioning-with-zero-dimensions',
            'fixed-positioning-with-zero-dimensions',
            'position-absolute-scenarios',
            'position-sticky-scenarios',
          ])
        })

        describe('transforms', () => {
          beforeEach(() => {
            cy.visit('/fixtures/visibility/transforms.html')
          })

          assertVisibilityForSections([
            'scaling',
            'translation',
            'rotation',
            'skew',
            'matrix',
            'perspective',
            'multiple',
            'multiple-3d',
            'backface-visibility',
          ])
        })

        describe('edge cases', () => {
          const isModern = mode === 'modern'

          beforeEach(() => {
            cy.visit('/fixtures/empty.html')
          })

          it('`display: contents` element is hidden in both modes', () => {
            // Per spec the element has no layout box; legacy's dim check and modern's
            // checkVisibility() both report it hidden.
            cy.$$('body').append('<div id="contents-el" style="display: contents;">contents</div>')
            cy.get('#contents-el').should('be.hidden')
          })

          it('child of `display: contents` parent is visible in both modes', () => {
            cy.$$('body').append('<div style="display: contents;"><span class="contents-child">child</span></div>')
            cy.get('.contents-child').should('be.visible')
          })

          it('`content-visibility: hidden`', () => {
            // Modern catches this via checkVisibility(); legacy doesn't model content-visibility.
            cy.$$('body').append('<div id="cv-hidden" style="content-visibility: hidden;">cv hidden</div>')
            cy.get('#cv-hidden').should(isModern ? 'be.hidden' : 'be.visible')
          })

          it('element inside a <template> fragment is hidden in both modes', () => {
            const tmpl = cy.$$('body').get(0).ownerDocument.createElement('template')

            tmpl.innerHTML = '<div id="in-template">never rendered</div>'
            cy.$$('body').get(0).appendChild(tmpl)
            const inTemplate = tmpl.content.querySelector('#in-template') as HTMLElement

            // Element lives in a detached document fragment with no layout box.
            expect(Cypress.dom.isHidden(inTemplate)).to.be.true
          })

          it('single-axis zero (`width: 0; height: 100px`) with overflowing text', () => {
            // Legacy preserves visibility because text overflows the zero-width box.
            // Modern hides it via the dim guard regardless of overflowing content.
            cy.$$('body').append('<div id="single-axis-zero" style="width: 0; height: 100px;">overflowing text</div>')
            cy.get('#single-axis-zero').should(isModern ? 'be.hidden' : 'be.visible')
          })

          it('`inert` element is visible (affects interactivity, not layout)', () => {
            cy.$$('body').append('<div id="inert-el" inert style="width: 100px; height: 100px;">inert</div>')
            cy.get('#inert-el').should('be.visible')
          })

          it('`aria-hidden="true"` element is visible (semantics, not rendering)', () => {
            cy.$$('body').append('<div id="aria-hidden-el" aria-hidden="true" style="width: 100px; height: 100px;">aria</div>')
            cy.get('#aria-hidden-el').should('be.visible')
          })
        })
      })
    })
  }

  context('#getReasonIsHidden', () => {
    const reasonIs = ($el: JQuery, str: string) => {
      expect(dom.getReasonIsHidden($el)).to.eq(str)
    }

    describe('basic css / box model', () => {
      beforeEach(() => {
        cy.visit('/fixtures/visibility/basic-css-properties.html')
      })

      it('has `display: none`', function () {
        prepareFixtureSection('display-property')
        cy.get('[cy-section="display-property"] .testCase[cy-expect="hidden"]:first').then(($el) => {
          reasonIs($el, 'This element `<div.testCase>` is not visible because it has CSS property: `display: none`')
        })
      })

      it('has a parent with `display: none`', function () {
        cy.visit('/fixtures/visibility/basic-css-properties.html')
        prepareFixtureSection('display-property')
        cy.get('[cy-section="display-property"] .testCase[cy-expect="hidden"] span').then(($el) => {
          reasonIs($el, 'This element `<span.testCase>` is not visible because its parent `<div.testCase>` has CSS property: `display: none`')
        })
      })

      it('has `visibility: hidden`', function () {
        prepareFixtureSection('visibility-property')
        cy.get('[cy-section="visibility-property"] .testCase[cy-expect="hidden"]').then((el) => {
          reasonIs($(el).first(), 'This element `<div.testCase>` is not visible because it has CSS property: `visibility: hidden`')
        })
      })

      it('has parent with `visibility: hidden`', function () {
        prepareFixtureSection('visibility-property')
        cy.get('[cy-section="visibility-property"] .testCase[cy-expect="hidden"] button').then((el) => {
          reasonIs($(el).first(), 'This element `<button.testCase>` is not visible because its parent `<div.testCase>` has CSS property: `visibility: hidden`')
        })
      })

      it('has `visibility: collapse`', function () {
        prepareFixtureSection('table-elements')
        cy.get('[cy-section="table-elements"] td[style*="visibility: collapse"]').then(($el) => {
          reasonIs($el, 'This element `<td.testCase>` is not visible because it has CSS property: `visibility: collapse`')
        })
      })

      it('has parent with `visibility: collapse`', function () {
        prepareFixtureSection('table-elements')
        cy.get('[cy-section="table-elements"] tr[style*="visibility: collapse"] td').then(($el) => {
          reasonIs($el, 'This element `<td.testCase>` is not visible because its parent `<tr.testCase>` has CSS property: `visibility: collapse`')
        })
      })

      it('has `opacity: 0`', function () {
        prepareFixtureSection('opacity-property')
        cy.get('[cy-section="opacity-property"] .testCase[cy-expect="hidden"]').then(($el) => {
          reasonIs($($el).first(), 'This element `<div.testCase>` is not visible because it has CSS property: `opacity: 0`')
        })
      })

      it('has parent with `opacity: 0`', function () {
        prepareFixtureSection('opacity-property')
        cy.get('[cy-section="opacity-property"] .testCase[cy-expect="hidden"] button').then(($el) => {
          reasonIs($el, 'This element `<button.testCase>` is not visible because its parent `<div.testCase>` has CSS property: `opacity: 0`')
        })
      })
    })

    it('is detached from the DOM', function () {
      const divDetached = $('<div>Detached</div>')

      reasonIs(divDetached, 'This element `<div>` is not visible because it is detached from the DOM')
    })

    describe('overflow-related', () => {
      beforeEach(() => {
        cy.visit('/fixtures/visibility/overflow.html')
      })

      it('has effective zero width', function () {
        prepareFixtureSection('zero-dimensions-with-overflow-hidden')
        cy.get('[cy-section="zero-dimensions-with-overflow-hidden"] .testCase[cy-label="Zero width ancestor, parent, self"]').then(($el) => {
          reasonIs($el, 'This element `<div.testCase>` is not visible because it has an effective width and height of: `0 x 100` pixels.')
        })
      })

      it('has effective zero height', function () {
        prepareFixtureSection('zero-dimensions-with-overflow-hidden')
        cy.get('[cy-section="zero-dimensions-with-overflow-hidden"] .testCase[cy-label="Zero height ancestor, parent, self"]').then(($el) => {
          reasonIs($el, 'This element `<div.testCase>` is not visible because it has an effective width and height of: `100 x 0` pixels.')
        })
      })

      it('has a parent with an effective zero width and overflow: hidden', function () {
        prepareFixtureSection('zero-dimensions-with-overflow-hidden')
        cy.get('[cy-section="zero-dimensions-with-overflow-hidden"] .testCase[cy-label="Zero height ancestor, parent, self"] span').then(($el) => {
          reasonIs($el, 'This element `<span.testCase>` is not visible because its parent `<div.testCase>` has CSS property: `overflow: hidden` and an effective width and height of: `100 x 0` pixels.')
        })
      })

      it('element sits outside boundaries of parent with overflow clipping', function () {
        prepareFixtureSection('overflow-hidden')
        cy.get('[cy-section="overflow-hidden"] .testCase[cy-label="Element out of bounds right"]').then(($el) => {
          reasonIs($el, 'This element `<div.testCase>` is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: `hidden`, `clip`, `scroll` or `auto`')
        })
      })
    })

    it('is hidden because it is backface', function () {
      cy.visit('/fixtures/visibility/transforms.html')
      prepareFixtureSection('backface-visibility')
      cy.get('[cy-section="backface-visibility"] .testCase[cy-label="RotateX 180deg with hidden backface"]').then(($el) => {
        reasonIs($el, 'This element `<div.testCase>` is not visible because it is rotated and its backface is hidden.')
      })
    })

    it('is hidden by transform', function () {
      cy.visit('/fixtures/visibility/transforms.html')
      prepareFixtureSection('scaling')
      cy.get('[cy-section="scaling"] .testCase[cy-label="ScaleX to zero"]').then(($el) => {
        reasonIs($el, 'This element `<div.testCase>` is not visible because it is hidden by transform.')
      })
    })

    it('element is fixed and being covered', function () {
      cy.visit('/fixtures/visibility/positioning.html')
      prepareFixtureSection('position-fixed-element-covered-by-another')
      cy.get('[cy-section="position-fixed-element-covered-by-another"] .testCase[cy-label="Fixed positioned element covered by another"]').then(($el) => {
        reasonIs($el, 'This element `<div.testCase>` is not visible because it has CSS property: `position: fixed` and it\'s being covered by another element:\n\n`<div class="testCase" cy-expect="visible" cy-label="Element covering fixed positioned element" style="position: fixed; bottom: 0; left: 0; background: lightskyblue; width: 100px; height: 100px;">on top</div>`')
      })
    })

    it('needs scroll', function () {
      cy.visit('/fixtures/visibility/empty.html')
      const el = cy.$$('body').append(`
          <div style="position: fixed; top: 0; right: 0; bottom: 0; left: 0; overflow-x: hidden; overflow-y: auto;">
            <div style="height: 800px">Big Element</div>
            <button id="needsScroll">MyButton</button>
          </div>
        `)

      reasonIs(el.find('#needsScroll'), `This element \`<button#needsScroll>\` is not visible because its ancestor has \`position: fixed\` CSS property and it is overflowed by other elements. How about scrolling to the element with \`cy.scrollIntoView()\`?`)
    })

    it('cannot determine why element is not visible', function () {
      // this element is actually visible
      // but used here as an example that does not match any of the above
      const visible = cy.$$('<div>Visible</div>')

      cy.$$('body').append(visible)
      reasonIs(visible, 'This element `<div>` is not visible.')
    })
  })
})
