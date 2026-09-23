describe('visibility', () => {
  const modes = ['modern', 'legacy'] as const

  for (const mode of modes) {
    describe(`${mode}`, {
      visibilityStrategy: mode,
    }, () => {
      const isModern = mode === 'modern'

      // https://github.com/cypress-io/cypress/issues/631
      describe('with overflow and transform - slider', () => {
        beforeEach(() => {
          cy.visit('/fixtures/issue-631.html')

          // Legacy walks ancestor overflow:hidden and reports slides 2/3 as hidden;
          // modern does not, so it considers all slides visible based on their own dims.
          cy.get('[name="test1"]').should('be.visible')
          cy.get('[name="test2"]').should(isModern ? 'be.visible' : 'be.hidden')
          cy.get('[name="test3"]').should(isModern ? 'be.visible' : 'be.hidden')
        })

        it('second slide', () => {
          cy.get('#button-2').click()

          cy.get('[name="test1"]').should(isModern ? 'be.visible' : 'be.hidden')
          cy.get('[name="test2"]').should('be.visible')
          cy.get('[name="test3"]').should(isModern ? 'be.visible' : 'be.hidden')
        })

        it('third slide', () => {
          cy.get('#button-3').click()

          cy.get('[name="test1"]').should(isModern ? 'be.visible' : 'be.hidden')
          cy.get('[name="test2"]').should(isModern ? 'be.visible' : 'be.hidden')
          cy.get('[name="test3"]').should('be.visible')
        })
      })

      describe('with shadow dom', () => {
        // https://github.com/cypress-io/cypress/issues/7794
        it('fixed position ancestor does not hang when checking visibility', () => {
          cy.visit('/fixtures/issue-7794.html')
          cy.get('.container-2').should('be.visible')
        })

        // TODO: move with tests added in this PR when it merges: https://github.com/cypress-io/cypress/pull/8166
        // #shadow-element-10 uses `backface-visibility: hidden` + `rotateY(180deg)`. Legacy's
        // transform analysis treats the back-facing element as hidden; modern does not.
        it('non-visible ancestor causes element to not be visible', () => {
          cy.visit('/fixtures/shadow-dom.html')
          cy
          .get('#shadow-element-10')
          .find('.shadow-div', { includeShadowDom: true })
          .should(isModern ? 'be.visible' : 'not.be.visible')
        })
      })

      describe('css opacity', () => {
        it('correctly detects visibility when opacity changes', () => {
          cy.visit('/fixtures/opacity.html')
          cy.get('#opacity')
          .should('be.visible')
          .click()
          .should('not.be.visible')
        })
      })
    })
  }

  // These tests verify Cypress's detection of backface-visibility: hidden
  // rotated past 90 degrees as hidden — a behavior provided only by the
  // legacy ancestor-walking visibility algorithm. The modern algorithm
  // delegates to the browser's Element.checkVisibility() API which
  // intentionally does not analyze 3D transforms, so this regression
  // coverage runs only under visibilityStrategy: 'legacy'.
  // https://github.com/cypress-io/cypress/issues/5682
  describe('backface-visibility: hidden elements', { visibilityStrategy: 'legacy' }, () => {
    beforeEach(() => {
      cy.visit('/fixtures/issue-5682.html')
    })

    describe('basic cases', () => {
      it('is visible when there is no transform', () => {
        cy.get('#b-1').should('be.visible')
      })

      it('is visible when an element is rotated < 90 degrees', () => {
        cy.get('#b-2').should('be.visible')
        cy.get('#b-3').should('be.visible')
      })

      it('is invisible when an element is rotated > 90 degrees', () => {
        cy.get('#b-4').should('not.be.visible')
        cy.get('#b-5').should('not.be.visible')
      })

      it('is invisible when an element is rotated in exact 90 degrees', () => {
        cy.get('#b-6').should('not.be.visible')
        cy.get('#b-7').should('not.be.visible')
      })

      it('is visible when an element is not backface-visibility: hidden but rotated > 90 degrees', () => {
        cy.get('#b-8').should('be.visible')
      })
    })

    describe('affected by ancestors', () => {
      describe('CASE 1: all transform-style: flat', () => {
        it('is invisible when parent is hidden', () => {
          cy.get('#a1-1').should('not.be.visible')
        })

        it('is visible when parent is visible', () => {
          cy.get('#a1-2').should('be.visible')
        })

        it('is visible when an element is backface-invisible whose parent is rotated > 90deg', () => {
          cy.get('#a1-3').should('be.visible')
        })

        it('is invisible when an element is rotated 190deg whose parent is rotated 90deg', () => {
          cy.get('#a1-4').should('not.be.visible')
        })
      })

      describe('CASE 2: when direct parents have preserve-3d', () => {
        it('target hidden + parents', () => {
          cy.get('#a2-1-1').should('not.be.visible')
          cy.get('#a2-1-2').should('not.be.visible')
          cy.get('#a2-1-3').should('not.be.visible')
          cy.get('#a2-1-4').should('not.be.visible')
        })

        it('target visible + parent visible', () => {
          cy.get('#a2-2-1').should('be.visible')
          cy.get('#a2-2-2').should('be.visible')
          cy.get('#a2-2-3').should('not.be.visible')
          cy.get('#a2-2-4').should('not.be.visible')
        })

        it('target visible + parent hidden', () => {
          cy.get('#a2-3-1').should('be.visible')
          cy.get('#a2-3-2').should('not.be.visible')
          cy.get('#a2-3-3').should('not.be.visible')
        })
      })

      it('swaps front and back visibility when a flip card container is clicked', () => {
        cy.get('.front').should('be.visible')
        cy.get('.back').should('not.be.visible')
        cy.get('.container').click()
        cy.get('.front').should('not.be.visible')
        cy.get('.back').should('be.visible')
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/8998
  // This regression verifies that scroll-clipped elements inside a position:fixed
  // ancestor are reported as not visible — a behavior provided only by the legacy
  // ancestor-walking algorithm. The modern algorithm delegates to
  // Element.checkVisibility() which intentionally doesn't detect scroll clipping.
  it('reports a scroll-clipped element inside a position: fixed ancestor as not visible', { visibilityStrategy: 'legacy' }, () => {
    cy.visit('fixtures/issue-8998.html')
    cy.get('.option').then((el) => {
      const x = Cypress.dom.isVisible(el[8])

      expect(x).to.be.false
    })
  })

  // https://github.com/cypress-io/cypress/issues/29605
  describe('elements with display: contents', () => {
    beforeEach(() => {
      cy.visit('/fixtures/issue-29605.html')
    })

    it('children of parent with no width/height are visible', () => {
      cy.get('#parent').should('not.be.visible')
      cy.get('#child').should('be.visible')
    })

    // https://drafts.csswg.org/css-display/#unbox
    it('elements the CSS box model does not render are not visible', () => {
      cy.get('#input').should('not.be.visible')
      cy.get('#select').should('not.be.visible')
    })
  })
})
