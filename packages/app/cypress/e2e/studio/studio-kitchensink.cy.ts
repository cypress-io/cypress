describe('Cypress Studio', () => {
  it('kitchensink - writes a test with all kinds of assertions', () => {
    function assertStudioHookCount (num: number) {
      cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
        cy.get('.command').should('have.length', num)
      })
    }

    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.visit(`http://localhost:4455/__/#/specs/runner?file=cypress/e2e/spec.cy.js`)

    cy.waitForSpecToFinish()

    // Should not show "Studio Commands" until we've started a new Studio session.
    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

    cy
    .contains('visits a basic html page')
    .closest('.runnable-wrapper')
    .realHover()
    .findByTestId('launch-studio')
    .click()

    // Studio re-executes spec before waiting for commands - wait for the spec to finish executing.
    cy.waitForSpecToFinish()

    cy.get('[data-cy="hook-name-studio commands"]').should('exist')

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be enabled').realClick()
      })
    })

    assertStudioHookCount(2)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be visible').realClick()
      })
    })

    assertStudioHookCount(4)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have text').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('Increment').realClick()
      })
    })

    assertStudioHookCount(6)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have id').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('increment').realClick()
      })
    })

    assertStudioHookCount(8)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have attr').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('onclick').realClick()
      })
    })

    assertStudioHookCount(10)

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      // 10 Commands - 5 assertions, each is a child of the subject's `cy.get`
      cy.get('.command').should('have.length', 10)

      // 5x cy.get Commands
      cy.get('.command-name-get').should('have.length', 5)

      // 5x Assertion Commands
      cy.get('.command-name-assert').should('have.length', 5)

      // (1) Assert Enabled
      cy.get('.command-name-assert').should('contain.text', 'expect <button#increment> to be enabled')

      // (2) Assert Visible
      cy.get('.command-name-assert').should('contain.text', 'expect <button#increment> to be visible')

      // (3) Assert Text
      cy.get('.command-name-assert').should('contain.text', 'expect <button#increment> to have text Increment')

      // (4) Assert Id
      cy.get('.command-name-assert').should('contain.text', 'expect <button#increment> to have id increment')

      // (5) Assert Attr
      cy.get('.command-name-assert').should('contain.text', 'expect <button#increment> to have attr onclick with the value increment()')
    })

    cy.get('button').contains('Save Commands').click()

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim()).to.eq(`
it('visits a basic html page', () => {
  cy.visit('cypress/e2e/index.html')
  /* ==== Generated with Cypress Studio ==== */
  cy.get('#increment').should('be.enabled');
  cy.get('#increment').should('be.visible');
  cy.get('#increment').should('have.text', 'Increment');
  cy.get('#increment').should('have.id', 'increment');
  cy.get('#increment').should('have.attr', 'onclick', 'increment()');
  /* ==== End Cypress Studio ==== */
})`
      .trim())
    })
  })
})
