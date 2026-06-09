import { SignalsComponent } from './signals.component'

describe('SignalsComponent', () => {
  it('can mount a signals component', () => {
    cy.mount(SignalsComponent)
  })

  it('can increment the count using a signal', () => {
    cy.mount(SignalsComponent)
    cy.get('span').contains(0)
    cy.get('button').click()
    cy.get('span').contains(1)
  })
})
