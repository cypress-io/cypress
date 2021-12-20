import { saveStudio, verifyCommandLog } from './index'

const isTextTerminal = Cypress.config('isTextTerminal')

export const externalTest = () => {
  it('can write to an imported test', () => {
    Cypress.config('isTextTerminal', isTextTerminal)

    cy.visit('/index.html').then(() => {
      Cypress.emit('run:end')
    })

    cy.get('.link', { log: false }).click({ log: false })

    verifyCommandLog(1, {
      selector: '.link',
      name: 'click',
    })

    saveStudio()
  })
}
