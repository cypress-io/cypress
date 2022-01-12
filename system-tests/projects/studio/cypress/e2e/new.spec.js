import { openStudio, saveStudio, verifyCommandLog, verifyVisit } from '../support'

const isTextTerminal = Cypress.config('isTextTerminal')

describe('creates new test', () => {
  openStudio()

  describe('test suite', () => {
    before(() => {
      Cypress.config('isTextTerminal', isTextTerminal)

      Cypress.emit('run:end')

      cy.wrap(Cypress.$(window.top.document.body), { log: false })
      .find('.runner', { log: false })
      .find('.input-active', { log: false })
      .type('new.html', { log: false }).then(() => {
        // we have to send a jquery click here since Cypress throws an error
        // as the click triggers a cy.visit() in the runner
        Cypress.$(window.top.document.body).find('.btn-submit').click()
      })

      cy.get('.btn', { log: false }).click({ log: false })

      verifyVisit('new.html')

      verifyCommandLog(2, {
        selector: '.btn',
        name: 'click',
      })

      saveStudio('My New Test')
    })
  })
})
