import { openStudio, saveStudio, verifyCommandLog } from '../support'

const isTextTerminal = Cypress.config('isTextTerminal')

describe('extends test', () => {
  openStudio()

  it('tracks each type of event and appends to existing test', () => {
    Cypress.config('isTextTerminal', isTextTerminal)

    cy.visit('/index.html').then(() => {
      Cypress.emit('run:end')
    })

    cy.get('.link', { log: false }).click({ log: false })
    cy.get('.input-text', { log: false }).type('testing', { log: false })
    cy.get('.input-radio', { log: false }).click({ log: false })
    cy.get('.input-checkbox', { log: false }).click({ log: false })
    cy.get('.input-checkbox', { log: false }).click({ log: false })
    cy.get('.select', { log: false }).select('1', { log: false })
    cy.get('button', { log: false }).click({ log: false, multiple: true })
    cy.get('p', { log: false }).click({ log: false })

    verifyCommandLog(1, {
      selector: '.link',
      name: 'click',
    })

    verifyCommandLog(2, {
      selector: '.input-text',
      name: 'type',
      message: 'testing',
    })

    verifyCommandLog(3, {
      selector: '.input-radio',
      name: 'check',
    })

    verifyCommandLog(4, {
      selector: '.input-checkbox',
      name: 'check',
    })

    verifyCommandLog(5, {
      selector: '.input-checkbox',
      name: 'uncheck',
    })

    verifyCommandLog(6, {
      selector: '.select',
      name: 'click',
    })

    verifyCommandLog(7, {
      selector: '[value="1"]',
      name: 'click',
    })

    verifyCommandLog(8, {
      selector: '.select',
      name: 'select',
      message: '1',
    })

    verifyCommandLog(9, {
      selector: '[data-cy=btn1]',
      name: 'click',
    })

    verifyCommandLog(10, {
      selector: '[data-test=btn2]',
      name: 'click',
    })

    verifyCommandLog(11, {
      selector: '[data-testid=btn3]',
      name: 'click',
    })

    verifyCommandLog(12, {
      selector: '#btn4',
      name: 'click',
    })

    verifyCommandLog(13, {
      selector: '.btn5',
      name: 'click',
    })

    verifyCommandLog(14, {
      selector: '[type="submit"]',
      name: 'click',
    })

    verifyCommandLog(15, {
      selector: ':nth-child(12)',
      name: 'click',
    })

    verifyCommandLog(16, {
      selector: 'p',
      name: 'click',
    })

    saveStudio()
  })
})
