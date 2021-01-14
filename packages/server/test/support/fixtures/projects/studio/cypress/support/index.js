export const openStudio = () => {
  it('opens studio', () => {
    Cypress.config('isTextTerminal', false)

    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter')
    .find('.runnable-controls-studio')
    .should('have.length', 3)
    .eq(2)
    .click()

    cy.wrap(Cypress.$(window.top.document.body))
    .find('reach-portal')
    .find('.btn-main')
    .click()

    cy.wait(1000)
  })
}

export const saveStudio = () => {
  cy.wrap(Cypress.$(window.top.document.body))
  .find('.runner')
  .find('.button-studio-save')
  .click()
}

export const verifyCommandLog = (index, { selector, name, message }) => {
  cy.wrap(Cypress.$(window.top.document.body), { log: false })
  .find('.reporter', { log: false })
  .find('.hook-studio', { log: false })
  .find('.command-number', { log: false })
  .contains(index, { log: false })
  .closest('.command', { log: false })
  .as(`parentCommand${index}`, { log: false })
  .find('.command-message', { log: false })
  .should('have.text', selector)

  cy.get(`@parentCommand${index}`, { log: false })
  .next('.command', { log: false })
  .as(`childCommand${index}`, { log: false })
  .find('.command-method', { log: false })
  .should('have.text', name)

  if (message) {
    cy.get(`@childCommand${index}`, { log: false })
    .find('.command-message', { log: false })
    .should('have.text', message)
  }
}
