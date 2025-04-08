function launchApp () {
  cy.scaffoldProject('selector-playground')
  cy.openProject('selector-playground')
  cy.startAppServer('e2e')
  cy.visitApp()
  cy.specsPageIsVisible()
  cy.get(`[data-cy-row="spec.cy.js"]`).click()

  cy.waitForSpecToFinish()
}

describe('selector playground', () => {
  it('highlight the element when hover over it.', () => {
    launchApp()

    cy.get('[data-cy="playground-activator"]').click()

    const backgroundColor = 'rgba(159, 196, 231, 0.6)'

    cy.getAutIframe().within(() => {
      cy.get('h1').realHover()
      cy.get('.__cypress-selector-playground').shadow().within(() => {
        // Test highlight exists
        cy.get('.highlight').should('exist')
        cy.get('.highlight').should('have.css', 'background-color', backgroundColor)

        // Test tooltip text is correct
        cy.get('.tooltip').should('have.text', 'h1')

        // Test placement of tooltip
        let highlightTop: any
        let tooltipTop: any

        cy.get('.highlight').then(($el) => {
          highlightTop = parseFloat($el.css('top'))
        })

        cy.get('.tooltip').then(($el) => {
          tooltipTop = parseFloat($el.css('top'))

          expect(tooltipTop).to.be.greaterThan(highlightTop)
        })
      })
    })

    cy.getAutIframe().within(() => {
      cy.get('h2').realHover()
      cy.get('.__cypress-selector-playground').shadow().within(() => {
        // Test highlight exists
        cy.get('.highlight').should('exist')
        cy.get('.highlight').should('have.css', 'background-color', backgroundColor)

        // Test tooltip text is correct
        cy.get('.tooltip').should('have.text', '[data-cy="h2-contents"]')

        // Test placement of tooltip
        let highlightTop: any
        let tooltipTop: any

        cy.get('.highlight').then(($el) => {
          highlightTop = parseFloat($el.css('top'))
        })

        cy.get('.tooltip').then(($el) => {
          tooltipTop = parseFloat($el.css('top'))

          expect(tooltipTop).to.be.lessThan(highlightTop)
        })
      })
    })
  })
})
