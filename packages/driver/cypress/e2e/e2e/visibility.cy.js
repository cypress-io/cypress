describe('visibility', () => {
  const modes = ['fast', 'legacy']

  for (const mode of modes) {
    describe(`${mode}`, {
      experimentalFastVisibility: mode === 'fast',
    }, () => {
      const isFast = mode === 'fast'

      // https://github.com/cypress-io/cypress/issues/631
      describe('with overflow and transform - slider', () => {
        beforeEach(() => {
          cy.visit('/fixtures/issue-631.html')

          // Legacy walks ancestor overflow:hidden and reports slides 2/3 as hidden;
          // fast does not, so it considers all slides visible based on their own dims.
          cy.get('[name="test1"]').should('be.visible')
          cy.get('[name="test2"]').should(isFast ? 'be.visible' : 'be.hidden')
          cy.get('[name="test3"]').should(isFast ? 'be.visible' : 'be.hidden')
        })

        it('second slide', () => {
          cy.get('#button-2').click()

          cy.get('[name="test1"]').should(isFast ? 'be.visible' : 'be.hidden')
          cy.get('[name="test2"]').should('be.visible')
          cy.get('[name="test3"]').should(isFast ? 'be.visible' : 'be.hidden')
        })

        it('third slide', () => {
          cy.get('#button-3').click()

          cy.get('[name="test1"]').should(isFast ? 'be.visible' : 'be.hidden')
          cy.get('[name="test2"]').should(isFast ? 'be.visible' : 'be.hidden')
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
        // point-sampling treats the back-facing element as hidden; fast does not.
        it('non-visible ancestor causes element to not be visible', () => {
          cy.visit('/fixtures/shadow-dom.html')
          cy
          .get('#shadow-element-10')
          .find('.shadow-div', { includeShadowDom: true })
          .should(isFast ? 'be.visible' : 'not.be.visible')
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
})
