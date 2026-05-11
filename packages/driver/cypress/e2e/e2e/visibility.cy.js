describe('visibility', () => {
  // These scenarios depend on the legacy ancestor-walking algorithm detecting
  // overflow:hidden clipping (slider) and `backface-visibility: hidden` rotation
  // (shadow-dom backface case) as hidden. The fast algorithm intentionally drops
  // those detections (see packages/driver/src/dom/visibility/MIGRATION_GUIDE.md),
  // so these specific tests run in legacy only.
  describe('legacy', { experimentalFastVisibility: false }, () => {
    // https://github.com/cypress-io/cypress/issues/631
    describe('with overflow and transform - slider', () => {
      beforeEach(() => {
        cy.visit('/fixtures/issue-631.html')

        // first slide is visible by default, nothing wrong here
        cy.get('[name="test1"]').should('be.visible')
        cy.get('[name="test2"]').should('not.be.visible')
        cy.get('[name="test3"]').should('not.be.visible')
      })

      it('second slide', () => {
        // ask for the second slide to become visible
        cy.get('#button-2').click()

        cy.get('[name="test1"]').should('not.be.visible')
        cy.get('[name="test2"]').should('be.visible')
        cy.get('[name="test3"]').should('not.be.visible')
      })

      it('third slide', () => {
        // ask for the second slide to become visible
        cy.get('#button-3').click()

        cy.get('[name="test1"]').should('not.be.visible')
        cy.get('[name="test2"]').should('not.be.visible')
        cy.get('[name="test3"]').should('be.visible')
      })
    })

    // TODO: move with tests added in this PR when it merges: https://github.com/cypress-io/cypress/pull/8166
    // The fixture's #shadow-element-10 host uses `backface-visibility: hidden` + `rotateY(180deg)`,
    // which only legacy's point-sampling pass treated as hidden.
    it('non-visible ancestor causes element to not be visible (shadow dom)', () => {
      cy.visit('/fixtures/shadow-dom.html')
      cy
      .get('#shadow-element-10')
      .find('.shadow-div', { includeShadowDom: true })
      .should('not.be.visible')
    })
  })

  // Scenarios that should produce identical visibility verdicts under both
  // algorithms — pure CSS hiding (opacity) and ancestor-positioning regression.
  const modes = ['fast', 'legacy']

  for (const mode of modes) {
    describe(`${mode}`, {
      experimentalFastVisibility: mode === 'fast',
    }, () => {
      // https://github.com/cypress-io/cypress/issues/7794
      it('fixed position ancestor does not hang when checking visibility', () => {
        cy.visit('/fixtures/issue-7794.html')
        cy.get('.container-2').should('be.visible')
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
})
