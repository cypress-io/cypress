import { openStudio, saveStudio, verifyCommandLog } from '../../../studio/cypress/support'

const isTextTerminal = Cypress.config('isTextTerminal')

describe('extends test', () => {
  openStudio()

  it('tracks each type of event and appends to existing test', () => {
    Cypress.config('isTextTerminal', isTextTerminal)

    cy.visit('/index.html').then(() => {
      Cypress.emit('run:end')
    })

    cy.get('.btn', { log: false }).click({ log: false })

    verifyCommandLog(1, {
      selector: '.btn',
      name: 'click',
    })

    saveStudio()
  })
})
