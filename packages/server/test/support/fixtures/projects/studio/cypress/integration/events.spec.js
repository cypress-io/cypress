import { openStudio, saveStudio, verifyCommandLog } from '../support'

const isTextTerminal = Cypress.config('isTextTerminal')

describe('studio tracks events', () => {
  openStudio()

  it('tracks each type of event and saves', () => {
    Cypress.config('isTextTerminal', isTextTerminal)

    cy.visit('/events.html').then(() => {
      Cypress.emit('run:end')
    })

    cy.get('.btn', { log: false }).click({ log: false, force: true })
    cy.get('.input-text', { log: false }).type('testing', { log: false, force: true })
    cy.get('.input-radio', { log: false }).click({ log: false, force: true })
    cy.get('.input-checkbox', { log: false }).click({ log: false, force: true })
    cy.get('.input-checkbox', { log: false }).click({ log: false, force: true })
    cy.get('.select', { log: false }).select('1', { log: false, force: true })

    verifyCommandLog(1, {
      selector: '.btn',
      name: 'click',
    })

    verifyCommandLog(2, {
      selector: '.input-text',
      name: 'click',
    })

    verifyCommandLog(3, {
      selector: '.input-text',
      name: 'type',
      message: 'testing',
    })

    verifyCommandLog(4, {
      selector: '.input-radio',
      name: 'check',
    })

    verifyCommandLog(5, {
      selector: '.input-checkbox',
      name: 'check',
    })

    verifyCommandLog(6, {
      selector: '.input-checkbox',
      name: 'uncheck',
    })

    verifyCommandLog(7, {
      selector: '.select',
      name: 'click',
    })

    verifyCommandLog(8, {
      selector: '[value="1"]',
      name: 'click',
    })

    verifyCommandLog(9, {
      selector: '.select',
      name: 'select',
      message: '1',
    })

    saveStudio()
  })
})
