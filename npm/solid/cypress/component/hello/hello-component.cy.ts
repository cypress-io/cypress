import { Hello } from './Hello'

describe('Hello', () => {
  it('hello ', () => {
    cy.mount(Hello, { log: true, name: 'Hello' })
    cy.contains('Hello')
    cy.get(`[data-cy="count"]`).contains('0')
    cy.get(`[data-cy="doubleCount"]`).contains('0')
    cy.get('button').click()
    cy.get(`[data-cy="count"]`).contains('1')
    cy.get(`[data-cy="doubleCount"]`).contains('2')
  })

  it('have not name ', () => {
    cy.mount(Hello, { log: true })
    cy.contains('Hello')
  })
})
