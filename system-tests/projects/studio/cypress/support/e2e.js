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
  })
}

export const saveStudio = (title = null) => {
  cy.wrap(Cypress.$(window.top.document.body))
  .find('.runner')
  .find('.button-studio-save')
  .click()

  if (title) {
    cy.wrap(Cypress.$(window.top.document.body))
    .find('reach-portal')
    .as('saveModal')
    .find('#testName')
    .type(title)

    cy.get('@saveModal')
    .find('.btn-main')
    .click()
  }
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

export const verifyVisit = (url) => {
  cy.wrap(Cypress.$(window.top.document.body), { log: false })
  .find('.reporter', { log: false })
  .find('.hook-studio', { log: false })
  .find('.command-number', { log: false })
  .contains('1', { log: false })
  .closest('.command', { log: false })
  .as(`parentCommandVisit`, { log: false })
  .find('.command-method', { log: false })
  .should('have.text', 'visit')

  cy.get(`@parentCommandVisit`, { log: false })
  .find('.command-message', { log: false })
  .should('have.text', url)
}
